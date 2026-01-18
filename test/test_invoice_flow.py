import re
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect


class TestInvoiceFlowUI(unittest.TestCase):
    BASE_URL = "http://localhost:3000"
    STORAGE_STATE_PATH = Path("test/.auth/state.json")
    SAMPLE_PDF = Path("test/invoices/invoice_Aaron_Bergman_36259.pdf")

    @classmethod
    def setUpClass(cls):
        """Start Playwright and launch the browser once for all tests."""
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=False, slow_mo=300)
        cls._ensure_storage_state()

    @classmethod
    def tearDownClass(cls):
        """Close the browser and stop Playwright after all tests."""
        cls.browser.close()
        cls.playwright.stop()

    @classmethod
    def _ensure_storage_state(cls):
        """
        Create a storage_state file by logging in ONCE per test run.
        This means: every time you run pytest, you will see the login once,
        then the rest of the flow will use the saved session.
        """
        cls.STORAGE_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

        # Always recreate storage state per run (do not reuse from previous runs)
        if cls.STORAGE_STATE_PATH.exists():
            cls.STORAGE_STATE_PATH.unlink()

        ctx = cls.browser.new_context()
        page = ctx.new_page()

        # Go to login page
        page.goto(f"{cls.BASE_URL}/login")
        page.wait_for_load_state("domcontentloaded")

        # Fill login form
        page.wait_for_selector("#username", timeout=15000)
        page.wait_for_selector("#password", timeout=15000)
        page.locator("#username").fill("admin")
        page.locator("#password").fill("admin")

        # Submit login
        page.get_by_role("button", name="Sign In").click()

        # Verify we are authenticated (dashboard redirect)
        expect(page).to_have_url(re.compile(r".*/dashboard.*"), timeout=20000)

        # Save session state for THIS RUN
        ctx.storage_state(path=str(cls.STORAGE_STATE_PATH))

        # Cleanup
        page.close()
        ctx.close()

    def setUp(self):
        """
        Create a fresh context/page for each test, but reuse saved auth state.
        This keeps tests isolated while avoiding repeated login steps.
        """
        self.context = self.browser.new_context(storage_state=str(self.STORAGE_STATE_PATH))
        self.page = self.context.new_page()

    def tearDown(self):
        """Close the page and context after each test."""
        self.page.close()
        self.context.close()

    # -------------------------
    # Helper methods
    # -------------------------
    def go_to_dashboard(self):
        """Navigate to dashboard and wait until it is loaded."""
        self.page.goto(f"{self.BASE_URL}/dashboard")
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_selector("text=Welcome to InvoiceAI", timeout=15000)

    def assert_login_success(self):
        """
        Assert that the user is logged in successfully using the stored session.
        We verify access to the dashboard and authenticated-only UI elements.
        """
        # Should not be redirected back to login
        self.assertNotIn("/login", self.page.url.lower())

        # Unique dashboard element for authenticated users
        self.page.wait_for_selector("text=Welcome to InvoiceAI", timeout=15000)
        self.assertTrue(self.page.get_by_text("Welcome to InvoiceAI").first.is_visible())

        # Optional: verify logout exists as another authenticated indicator
        self.assertTrue(self.page.get_by_text("Logout").first.is_visible())

    def go_to_upload_page(self):
        """Navigate to upload page and wait until upload UI is visible."""
        self.page.goto(f"{self.BASE_URL}/upload")
        self.page.wait_for_load_state("domcontentloaded")
        self.page.wait_for_selector("text=Upload Invoice", timeout=15000)
        self.page.wait_for_selector("input[type='file']", timeout=15000)

    def go_to_invoices_page(self):
        """Navigate to invoices page and wait until it is loaded."""
        self.page.goto(f"{self.BASE_URL}/invoices")
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_selector("text=Invoices", timeout=15000)

    def upload_invoice_file(self):
        """
        Upload a PDF invoice file using the <input type="file"> element.
        Assumes we are already on /upload.
        """
        self.assertTrue(self.SAMPLE_PDF.exists(), f"Sample PDF not found: {self.SAMPLE_PDF}")

        file_input = self.page.locator("input[type='file']").first
        file_input.wait_for(state="attached", timeout=15000)

        # Inject file into the file input
        file_input.set_input_files(str(self.SAMPLE_PDF))

        # Click the upload/extract button
        upload_btn = self.page.get_by_text("Upload & Extract Data").first
        self.assertTrue(upload_btn.is_visible())
        upload_btn.click()

        # Give the app time to process / redirect / update UI
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_timeout(1000)

    # -------------------------
    # ONE FULL FLOW TEST
    # -------------------------
    def test_full_flow_dashboard_upload_and_invoices_components(self):
        """
        Single flow test:
        Dashboard -> (verify login success) -> Upload -> Upload&Extract
        -> Invoices (entered ONCE) -> component checks.
        """
        # Dashboard (session-based login)
        self.go_to_dashboard()

        # ✅ Verify login success BEFORE upload
        self.assert_login_success()

        # Upload
        self.go_to_upload_page()
        self.upload_invoice_file()

        # Go to invoices ONCE
        self.go_to_invoices_page()

        # Poll on the same invoices page (reload) until filename appears
        filename = self.SAMPLE_PDF.name
        for _ in range(30):
            body_text = self.page.inner_text("body")
            if filename in body_text:
                break
            self.page.reload()
            self.page.wait_for_load_state("networkidle")
            self.page.wait_for_timeout(1000)
        else:
            self.fail(f"Upload did not appear after 30 seconds on /invoices. Expected '{filename}'")

        # Component checks on the SAME invoices page (no more navigation)
        vendor_input = self.page.get_by_placeholder("Enter vendor name")
        self.assertTrue(vendor_input.is_visible())

        search_btn = self.page.get_by_role("button", name="Search")
        self.assertTrue(search_btn.is_visible())

        body_lower = self.page.inner_text("body").lower()
        if "no invoices uploaded yet" in body_lower:
            self.assertTrue(self.page.get_by_text("No invoices uploaded yet.").is_visible())
            self.assertTrue(self.page.get_by_text("Upload now").is_visible())
        else:
            self.page.wait_for_selector("text=Local History", timeout=15000)
            self.page.wait_for_selector("text=View Details", timeout=15000)
            self.assertTrue(self.page.get_by_text("View Details").first.is_visible())


if __name__ == "__main__":
    unittest.main()
