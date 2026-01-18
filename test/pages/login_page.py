import re
from playwright.sync_api import expect
from .dashboard_page import DashboardPage


class LoginPage:
    def __init__(self, page, base_url: str):
        self.page = page
        self.base_url = base_url

        # selectors
        self.username_selector = "#username"
        self.password_selector = "#password"

        # role-based locator
        self.sign_in_role = "button"
        self.sign_in_name = "Sign In"

        # allowed in POM: verify page loaded
        self.page.wait_for_load_state("domcontentloaded")
        self.page.wait_for_selector(self.username_selector, timeout=15000)
        self.page.wait_for_selector(self.password_selector, timeout=15000)

    @classmethod
    def open(cls, page, base_url: str):
        page.goto(f"{base_url}/login")
        return cls(page, base_url)

    def login(self, username: str, password: str):
        self.page.locator(self.username_selector).fill(username)
        self.page.locator(self.password_selector).fill(password)
        self.page.get_by_role(self.sign_in_role, name=self.sign_in_name).click()

        # page chaining
        return DashboardPage(self.page, self.base_url)

    def expect_still_on_login(self):
        expect(self.page).to_have_url(re.compile(r".*/login.*"))


