import re
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

from test.pages.login_page import LoginPage
from test.pages.dashboard_page import DashboardPage
from test.pages.upload_page import UploadPage
from test.pages.invoices_page import InvoicesPage


class TestInvoiceFlowUI(unittest.TestCase):
    BASE_URL = "http://localhost:3000"
    STORAGE_STATE_PATH = Path("test/.auth/state.json")
    SAMPLE_PDF = Path("invoices/invoice_Aaron_Bergman_36259.pdf")

    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=False, slow_mo=300)
        cls._ensure_storage_state()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    @classmethod
    def _ensure_storage_state(cls):
        """
        Login ONCE per test run and save storage_state.
        Assertions here are OK because this is test setup logic.
        """
        cls.STORAGE_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

        if cls.STORAGE_STATE_PATH.exists():
            cls.STORAGE_STATE_PATH.unlink()

        ctx = cls.browser.new_context()
        page = ctx.new_page()

        login = LoginPage.open(page, cls.BASE_URL)
        _dashboard = login.login("admin", "admin")

        # verify authenticated redirect (setup assertion)
        expect(page).to_have_url(re.compile(r".*/dashboard.*"), timeout=20000)

        ctx.storage_state(path=str(cls.STORAGE_STATE_PATH))
        page.close()
        ctx.close()

    def setUp(self):
        self.context = self.browser.new_context(storage_state=str(self.STORAGE_STATE_PATH))
        self.page = self.context.new_page()

    def tearDown(self):
        self.page.close()
        self.context.close()

    def test_full_flow_dashboard_upload_and_invoices_components(self):
        # 1) Dashboard
        dashboard = DashboardPage.open(self.page, self.BASE_URL).wait_loaded()

        # Assertions stay in test
        self.assertNotIn("/login", self.page.url.lower())
        self.assertTrue(dashboard.is_welcome_visible())
        self.assertTrue(dashboard.is_logout_visible())

        # 2) Upload
        self.assertTrue(self.SAMPLE_PDF.exists(), f"Sample PDF not found: {self.SAMPLE_PDF}")
        upload = UploadPage.open(self.page, self.BASE_URL)
        upload.upload_invoice_pdf(self.SAMPLE_PDF)

        # 3) Invoices
        invoices = InvoicesPage.open(self.page, self.BASE_URL)

        filename = self.SAMPLE_PDF.name
        appeared = invoices.wait_until_invoice_appears(filename, attempts=30, delay_ms=1000)
        self.assertTrue(appeared, f"Upload did not appear after 30 seconds on /invoices. Expected '{filename}'")

        # 4) Component checks (assertions in test)
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
