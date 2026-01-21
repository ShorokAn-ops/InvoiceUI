import re
import unittest
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

from test.pages.login_page import LoginPage
from test.pages.dashboard_page import DashboardPage
from test.pages.upload_page import UploadPage
from test.pages.invoices_page import InvoicesPage


class TestInvoiceFlowUI(unittest.TestCase):
    # --- Exercise requirements: env vars ---
    BASE_URL = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
    HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
    BROWSER = os.getenv("BROWSER", "chrome").lower()
    WIDTH = int(os.getenv("SCREEN_WIDTH", "1920"))
    HEIGHT = int(os.getenv("SCREEN_HEIGHT", "1080"))

    STORAGE_STATE_PATH = Path("test/.auth/state.json")
    SAMPLE_PDF = Path("test/invoices/invoice_Aaron_Bergman_36259.pdf")

    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()

        # choose browser based on env (chrome/firefox)
        if cls.BROWSER == "chrome":
            browser_type = cls.playwright.chromium
        elif cls.BROWSER == "firefox":
            browser_type = cls.playwright.firefox
        else:
            raise ValueError(f"Unsupported BROWSER: {cls.BROWSER} (use 'chrome' or 'firefox')")

        slow_mo = 0 if cls.HEADLESS else 300
        cls.browser = browser_type.launch(headless=cls.HEADLESS, slow_mo=slow_mo)

        cls._ensure_storage_state()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    @classmethod
    def _maybe_pass_ngrok_warning(cls, page):
        # ngrok may show a warning page with "Visit Site"
        try:
            page.get_by_role("button", name="Visit Site").click(timeout=2500)
        except Exception:
            pass

    @classmethod
    def _ensure_storage_state(cls):
        """
        Login ONCE per test run and save storage_state.
        """
        cls.STORAGE_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

        if cls.STORAGE_STATE_PATH.exists():
            cls.STORAGE_STATE_PATH.unlink()

        # apply viewport from env (important for matrix resolutions)
        ctx = cls.browser.new_context(viewport={"width": cls.WIDTH, "height": cls.HEIGHT})
        page = ctx.new_page()

        login = LoginPage.open(page, cls.BASE_URL)
        cls._maybe_pass_ngrok_warning(page)

        _dashboard = login.login("admin", "admin")

        # verify authenticated redirect (setup assertion)
        expect(page).to_have_url(re.compile(r".*/dashboard.*"), timeout=20000)

        ctx.storage_state(path=str(cls.STORAGE_STATE_PATH))
        page.close()
        ctx.close()

    def setUp(self):
        self.context = self.browser.new_context(
            storage_state=str(self.STORAGE_STATE_PATH),
            viewport={"width": self.WIDTH, "height": self.HEIGHT}
        )
        self.page = self.context.new_page()
        
        # Capture console errors for debugging
        self.page.on("console", lambda msg: print(f"Browser console [{msg.type}]: {msg.text}") if msg.type in ["error", "warning"] else None)
        self.page.on("pageerror", lambda exc: print(f"Page error: {exc}"))

    def tearDown(self):
        self.page.close()
        self.context.close()

    def test_full_flow_dashboard_upload_and_invoices_components(self):
        # 1) Dashboard
        dashboard = DashboardPage.open(self.page, self.BASE_URL).wait_loaded()

        self.assertNotIn("/login", self.page.url.lower())
        self.assertTrue(dashboard.is_welcome_visible())
        self.assertTrue(dashboard.is_logout_visible())

        # 2) Upload
        self.assertTrue(self.SAMPLE_PDF.exists(), f"Sample PDF not found: {self.SAMPLE_PDF}")
        upload = UploadPage.open(self.page, self.BASE_URL)
        upload.upload_invoice_pdf(self.SAMPLE_PDF)
        
        # Wait for either success or error toast
        try:
            # Wait for success
            self.page.wait_for_selector("text=Invoice uploaded and processed successfully", timeout=15000)
            print("[SUCCESS] Upload succeeded - success toast found")
        except Exception:
            # Check for error messages
            page_text = self.page.inner_text("body")
            if "duplicate" in page_text.lower():
                print("[WARNING] Duplicate invoice detected - continuing test")
            elif "upload failed" in page_text.lower() or "failed" in page_text.lower():
                # Take screenshot for debugging
                self.page.screenshot(path="upload_failed.png")
                print(f"[ERROR] Upload failed. Page text: {page_text[:500]}")
                self.fail("Upload failed - check upload_failed.png for details")
            else:
                print("[WARNING] No clear success or error toast found")
                self.page.screenshot(path="upload_unclear.png")
                print("[INFO] Backend connection may have failed - is the backend server running on port 8080?")
        
        # Check localStorage after upload
        try:
            invoices_data = self.page.evaluate("() => localStorage.getItem('invoices')")
            if invoices_data:
                import json
                invoices_list = json.loads(invoices_data)
                print(f"[SUCCESS] localStorage has {len(invoices_list)} invoice(s)")
                if invoices_list:
                    print(f"  Last invoice: {invoices_list[-1].get('fileName', 'unknown')}")
            else:
                print("[ERROR] localStorage invoices is empty/null - Backend API likely not responding")
                print("[INFO] Make sure the backend server is running on http://localhost:8080")
                self.fail("Upload failed: Backend API not responding. Start the backend server and try again.")
        except Exception as e:
            print(f"[ERROR] Could not read localStorage: {e}")

        # 3) Invoices
        invoices = InvoicesPage.open(self.page, self.BASE_URL)

        filename = self.SAMPLE_PDF.name
        appeared = invoices.wait_until_invoice_appears(filename, attempts=30, delay_ms=1000)
        self.assertTrue(appeared, f"Upload did not appear after 30 seconds on /invoices. Expected '{filename}'")

        # 4) Component checks
        self.assertTrue(invoices.is_vendor_input_visible())
        self.assertTrue(invoices.is_search_button_visible())

        if invoices.has_no_invoices_message():
            self.assertTrue(invoices.is_no_invoices_visible())
            self.assertTrue(invoices.is_upload_now_visible())
        else:
            self.assertTrue(invoices.is_local_history_visible())
            self.assertTrue(invoices.is_view_details_visible())


if __name__ == "__main__":
    unittest.main()