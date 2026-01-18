import re
from playwright.sync_api import expect


class DashboardPage:
    def __init__(self, page, base_url: str):
        self.page = page
        self.base_url = base_url

        # Texts / unique UI elements
        self.welcome_text = "Welcome to InvoiceAI"
        self.quick_actions_text = "Quick Actions"
        self.logout_text = "Logout"

    @classmethod
    def open(cls, page, base_url: str):
        page.goto(f"{base_url}/dashboard")
        return cls(page, base_url)

    # ---- page load verification (allowed in POM) ----
    def wait_loaded(self):
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_selector(f"text={self.welcome_text}", timeout=15000)
        return self

    # ---- expectations used by tests ----
    def expect_on_dashboard(self):
        expect(self.page).to_have_url(re.compile(r".*/dashboard.*"))
        return self

    # ---- visibility helpers (NO asserts here) ----
    def is_welcome_visible(self) -> bool:
        return self.page.get_by_text(self.welcome_text).is_visible()

    def is_quick_actions_visible(self) -> bool:
        return self.page.get_by_text(self.quick_actions_text).is_visible()

    def is_logout_visible(self) -> bool:
        return self.page.get_by_text(self.logout_text).is_visible()
