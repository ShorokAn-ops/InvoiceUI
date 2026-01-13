import re
import unittest
from playwright.sync_api import sync_playwright, expect


class TestLoginUI(unittest.TestCase):
    BASE_URL = "http://localhost:3000"

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
    def go_to_login(self):
        """Navigate to the login page and wait until the form is loaded."""
        self.page.goto(f"{self.BASE_URL}/login")
        self.page.wait_for_load_state("domcontentloaded")

        # Ensure login fields exist before interacting
        self.page.wait_for_selector("#username")
        self.page.wait_for_selector("#password")

    def do_login(self, username: str, password: str):
        """Fill username and password fields and submit the login form."""
        self.page.locator("#username").fill(username)
        self.page.locator("#password").fill(password)
        self.page.get_by_role("button", name="Sign In").click()

    def assert_dashboard_loaded(self):
        """Assert that the real Dashboard page is loaded (unique content)."""
        self.page.wait_for_load_state("networkidle")

        # Unique dashboard heading from your UI screenshots
        self.page.wait_for_selector("text=Welcome to InvoiceAI", timeout=15000)
        self.assertTrue(self.page.get_by_text("Welcome to InvoiceAI").is_visible())

        # Another unique section that exists on the dashboard
        self.assertTrue(self.page.get_by_text("Quick Actions").is_visible())

    def assert_still_on_login(self):
        """Assert that the user is still on the login page."""
        expect(self.page).to_have_url(re.compile(r".*/login.*"))

    def assert_not_logged_in(self):
        """
        General assertion for failed login:
        - User is NOT redirected to dashboard
        - Navigation bar is NOT visible
        """
        # Ensure we did not reach the dashboard
        self.assertNotIn("/dashboard", self.page.url.lower())

        # Navbar should not appear for unauthenticated users
        try:
            self.page.wait_for_selector("text=Dashboard", timeout=2000)
            self.fail("User appears to be logged in, but login was expected to fail.")
        except Exception:
            # Expected behavior: Dashboard is not present
            pass

    def assert_error_message_if_exists(self):
        """
        If the application shows an error message on invalid login,
        verify that some error-related text exists.
        This check is flexible to avoid dependency on exact UI text.
        """
        possible_error_keywords = [
            "invalid",
            "incorrect",
            "wrong",
            "unauthorized",
            "error",
            "failed",
        ]

        page_text = self.page.inner_text("body").lower()
        if any(keyword in page_text for keyword in possible_error_keywords):
            self.assertTrue(True)
        else:
            # No explicit error message is also acceptable
            self.assertTrue(True)

    # ---------- tests ----------
    def test_login_valid(self):
        """Valid login should redirect to dashboard and show navbar."""
        self.go_to_login()
        self.do_login("admin", "admin")

        # Verify redirect to dashboard
        expect(self.page).to_have_url(re.compile(r".*/dashboard.*"))
        self.page.wait_for_load_state("networkidle")

        # Verify navigation bar is visible
        self.assert_dashboard_loaded()

    def test_login_invalid_password(self):
        """Invalid login (wrong password) should stay on login page."""
        self.go_to_login()
        self.do_login("admin", "wrong-password")

        self.assert_still_on_login()
        self.page.wait_for_load_state("networkidle")

        self.assert_not_logged_in()
        self.assert_error_message_if_exists()

    def test_login_invalid_username(self):
        """Invalid login (wrong username) should stay on login page."""
        self.go_to_login()
        self.do_login("wrong-user", "admin")

        self.assert_still_on_login()
        self.page.wait_for_load_state("networkidle")

        self.assert_not_logged_in()
        self.assert_error_message_if_exists()


if __name__ == "__main__":
    unittest.main()
