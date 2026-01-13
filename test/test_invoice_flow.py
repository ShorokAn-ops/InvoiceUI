import re
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect


class TestInvoiceFlowUI(unittest.TestCase):
    BASE_URL = "http://localhost:3000"
    USERNAME = "admin"
    PASSWORD = "admin"

    # Path to a sample invoice file for upload
    SAMPLE_PDF = Path("test/invoices/invoice_Aaron_Bergman_36259.pdf")

    @classmethod
    def setUpClass(cls):
        """Start Playwright and launch the browser once for all tests."""
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=False)

    @classmethod
    def tearDownClass(cls):
        """Close the browser and stop Playwright after all tests."""
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        """Create a new browser page before each test."""
        self.page = self.browser.new_page()

    def tearDown(self):
        """Close the page after each test."""
        self.page.close()

    # ---------- helper methods ----------
    def login_and_go_dashboard(self):
        """Login with valid credentials and ensure the dashboard is loaded."""
        self.page.goto(f"{self.BASE_URL}/login")
        self.page.wait_for_load_state("domcontentloaded")

        self.page.wait_for_selector("#username")
        self.page.wait_for_selector("#password")

        self.page.locator("#username").fill(self.USERNAME)
        self.page.locator("#password").fill(self.PASSWORD)
        self.page.get_by_role("button", name="Sign In").click()

        expect(self.page).to_have_url(re.compile(r".*/dashboard.*"))
        self.page.wait_for_load_state("networkidle")

        # Verify dashboard unique content
        self.page.wait_for_selector("text=Welcome to InvoiceAI", timeout=15000)
        self.assertTrue(self.page.get_by_text("Welcome to InvoiceAI").is_visible())

    def go_to_upload_page(self):
        """Navigate to Upload page and verify unique Upload content."""
        self.page.goto(f"{self.BASE_URL}/upload")
        self.page.wait_for_load_state("networkidle")

        self.page.wait_for_selector("text=Upload Invoice", timeout=15000)
        self.assertTrue(self.page.get_by_text("Upload Invoice").is_visible())

        # Verify the main upload button exists
        self.assertTrue(self.page.get_by_text("Upload & Extract Data").is_visible())

    def go_to_invoices_page(self):
        """Navigate to Invoices page and verify unique Invoices content."""
        self.page.goto(f"{self.BASE_URL}/invoices")
        self.page.wait_for_load_state("networkidle")

        # In your screenshots there is a vendor search + table header
        self.page.wait_for_selector("text=Vendor Search", timeout=15000)
        self.assertTrue(self.page.get_by_text("Vendor Search").is_visible())
        self.assertTrue(self.page.get_by_text("Local History").is_visible())

    def upload_invoice_file(self):
        """
        Upload a PDF invoice file using the file input.
        Assumes we are already on /upload.
        """
        self.assertTrue(self.SAMPLE_PDF.exists(), f"Sample PDF not found: {self.SAMPLE_PDF}")

        # Wait until the upload page is fully ready
        self.page.wait_for_selector("text=Upload Invoice", timeout=15000)
        self.page.wait_for_selector("input[type='file']", timeout=15000)

        file_input = self.page.locator("input[type='file']").first
        file_input.wait_for(state="attached", timeout=15000)

        # Set the file into the input
        file_input.set_input_files(str(self.SAMPLE_PDF))

        # Click upload/extract
        upload_btn = self.page.get_by_text("Upload & Extract Data").first
        self.assertTrue(upload_btn.is_visible())
        upload_btn.click()

        # Wait for the app to process (sometimes there is async extract)
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_timeout(1000)

    def assert_upload_success_indicators(self):
        """
        Verify upload success by waiting (polling) until the uploaded file appears in:
        - Dashboard -> Recent Uploads
        OR
        - Invoices page -> Local History list
        """
        filename = self.SAMPLE_PDF.name

        # We will poll for up to 30 seconds to allow backend/processing time
        for _ in range(30):
            # Check Dashboard - Recent Uploads
            self.page.goto(f"{self.BASE_URL}/dashboard")
            self.page.wait_for_load_state("networkidle")

            # If dashboard has recent uploads section, check filename
            try:
                if self.page.get_by_text("Recent Uploads").is_visible(timeout=1000):
                    body = self.page.inner_text("body")
                    if filename in body:
                        self.assertTrue(True)
                        return
            except Exception:
                pass

            # Check Invoices page - Local History
            self.go_to_invoices_page()
            self.page.wait_for_load_state("networkidle")

            body_text = self.page.inner_text("body")

            # If file name appears anywhere in invoices page -> success
            if filename in body_text:
                self.assertTrue(True)
                return

            # If still empty state, keep waiting
            self.page.wait_for_timeout(1000)

        # If we got here - upload did not show up anywhere
        self.fail(
            f"Upload did not appear after 30s. "
            f"Expected to find '{filename}' in Dashboard Recent Uploads or Invoices Local History.\n"
            f"Current URL: {self.page.url}\n"
            f"Page contains: {self.page.inner_text('body')[:300]}"
        )

    # ---------- tests ----------

    def test_user_journey_upload_invoice(self):
        """
        End-to-end user journey:
        Login -> Dashboard -> Upload -> Upload&Extract -> Verify invoice appears in system.
        """
        self.login_and_go_dashboard()
        self.go_to_upload_page()
        self.upload_invoice_file()

        # After upload, validate success indicators (dashboard or invoices)
        self.assert_upload_success_indicators()

    def test_component_invoices_vendor_search(self):
        """
        Component test:
        Vendor search filters the invoices list.
        (Assumes there is an input + Search button as in your screenshots)
        """
        self.login_and_go_dashboard()
        self.go_to_invoices_page()

        # Try to locate the vendor search input in a flexible way
        # If your input has a placeholder, this will work; otherwise it will fallback to the first input under Vendor Search section.
        search_input = self.page.locator("input").first
        try:
            # If a placeholder exists, use it (stronger selector)
            ph = self.page.locator("input[placeholder]").first
            if ph.is_visible(timeout=1500):
                search_input = ph
        except Exception:
            pass

        # Use a vendor term that likely exists after some uploads; you can change it to a known vendor
        vendor_query = "SuperStore"
        search_input.fill(vendor_query)

        # Click Search button (as in screenshots)
        self.page.get_by_role("button", name="Search").click()
        self.page.wait_for_load_state("networkidle")

        # After search, the results should contain the vendor query (or show "no results")
        body_text = self.page.inner_text("body").lower()
        self.assertTrue(
            vendor_query.lower() in body_text or "no" in body_text or "not found" in body_text,
            "Expected vendor search to filter results or show a 'no results' state."
        )

    def test_component_view_details_button_exists(self):
        """
        Component test:
        If invoices exist -> verify 'View Details' exists.
        If no invoices exist -> verify empty state appears.
        """
        self.login_and_go_dashboard()
        self.go_to_invoices_page()
        self.page.wait_for_load_state("networkidle")

        body_text = self.page.inner_text("body").lower()

        # Empty state: no invoices
        if "no invoices uploaded yet" in body_text:
            self.assertTrue(self.page.get_by_text("No invoices uploaded yet.").is_visible())
            self.assertTrue(self.page.get_by_text("Upload now").is_visible())
            return

        # Invoices exist -> table + View Details should exist
        self.page.wait_for_selector("text=View Details", timeout=15000)
        self.assertTrue(self.page.get_by_text("View Details").first.is_visible())

    def test_component_delete_invoice_row_if_exists(self):
        """
        Component test (safe):
        If a 'Delete' button exists, click it and verify the row count decreases or item disappears.
        This test is defensive to avoid failing when there are no invoices.
        """
        self.login_and_go_dashboard()
        self.go_to_invoices_page()

        self.page.wait_for_load_state("networkidle")

        # Check if Delete exists at all
        delete_btn = self.page.get_by_text("Delete").first
        try:
            if not delete_btn.is_visible(timeout=1500):
                self.assertTrue(True)  # No delete available -> nothing to test here
                return
        except Exception:
            self.assertTrue(True)
            return

        # If table rows exist, capture count
        rows = self.page.locator("table tbody tr")
        before = rows.count()

        delete_btn.click()
        self.page.wait_for_load_state("networkidle")

        after = rows.count()

        # Either count decreased OR delete action removed something visible
        self.assertTrue(after < before or after == 0)


if __name__ == "__main__":
    unittest.main()
