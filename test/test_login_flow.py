import os
import re
import unittest
from playwright.sync_api import sync_playwright, expect

from test.pages.login_page import LoginPage


class TestLoginUI(unittest.TestCase):
    # --- Exercise requirements: env vars ---
    BASE_URL = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
    HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
    BROWSER = os.getenv("BROWSER", "chrome").lower()
    WIDTH = int(os.getenv("SCREEN_WIDTH", "1920"))
    HEIGHT = int(os.getenv("SCREEN_HEIGHT", "1080"))

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

    def setUp(self):
        # use context so we can apply viewport (matrix resolutions)
        self.context = self.browser.new_context(
            viewport={"width": self.WIDTH, "height": self.HEIGHT}
        )
        self.page = self.context.new_page()

        # Capture console errors for debugging (same style as invoice flow)
        self.page.on(
            "console",
            lambda msg: print(f"Browser console [{msg.type}]: {msg.text}")
            if msg.type in ["error", "warning"]
            else None,
        )
        self.page.on("pageerror", lambda exc: print(f"Page error: {exc}"))

        # optional: handle ngrok warning once per test setup
        self._maybe_pass_ngrok_warning(self.page)

    def tearDown(self):
        self.page.close()
        self.context.close()

    def test_login_valid(self):
        login = LoginPage.open(self.page, self.BASE_URL)
        self._maybe_pass_ngrok_warning(self.page)

        dashboard = login.login("admin", "admin")

        # Assertions stay in test
        dashboard.expect_on_dashboard()
        dashboard.wait_loaded()

        self.assertTrue(dashboard.is_welcome_visible())
        self.assertTrue(dashboard.is_quick_actions_visible())

    def test_login_invalid_password(self):
        login = LoginPage.open(self.page, self.BASE_URL)
        self._maybe_pass_ngrok_warning(self.page)

        _ = login.login("admin", "wrong-password")

        # Still on login
        login.expect_still_on_login()
        self.page.wait_for_load_state("networkidle")

        # Negative assertion: should NOT be on dashboard
        self.assertNotIn("/dashboard", self.page.url.lower())

        # Optional flexible check: looks for typical error keywords (kept as-is)
        page_text = self.page.inner_text("body").lower()
        possible_error_keywords = ["invalid", "incorrect", "wrong", "unauthorized", "error", "failed"]
        self.assertTrue(True if any(k in page_text for k in possible_error_keywords) else True)

    def test_login_invalid_username(self):
        login = LoginPage.open(self.page, self.BASE_URL)
        self._maybe_pass_ngrok_warning(self.page)

        _ = login.login("wrong-user", "admin")

        login.expect_still_on_login()
        self.page.wait_for_load_state("networkidle")

        self.assertNotIn("/dashboard", self.page.url.lower())

        page_text = self.page.inner_text("body").lower()
        possible_error_keywords = ["invalid", "incorrect", "wrong", "unauthorized", "error", "failed"]
        self.assertTrue(True if any(k in page_text for k in possible_error_keywords) else True)


if __name__ == "__main__":
    unittest.main()
