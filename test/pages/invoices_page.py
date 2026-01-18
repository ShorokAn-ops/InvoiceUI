class InvoicesPage:
    def __init__(self, page, base_url: str):
        self.page = page
        self.base_url = base_url

        self.header_text = "Invoices"

        # vendor search
        self.vendor_placeholder = "Enter vendor name"
        self.search_role = "button"
        self.search_name = "Search"

        # empty / populated states
        self.no_invoices_text = "No invoices uploaded yet."
        self.upload_now_text = "Upload now"
        self.local_history_text = "Local History"
        self.view_details_text = "View Details"

        # allowed in POM: verify page loaded
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_selector(f"text={self.header_text}", timeout=15000)

    @classmethod
    def open(cls, page, base_url: str):
        page.goto(f"{base_url}/invoices")
        return cls(page, base_url)

    def wait_until_invoice_appears(self, filename: str, attempts: int = 30, delay_ms: int = 1000) -> bool:
        for _ in range(attempts):
            if filename in self.page.inner_text("body"):
                return True
            self.page.reload()
            self.page.wait_for_load_state("networkidle")
            self.page.wait_for_timeout(delay_ms)
        return False

    # ---------- component visibility (NO asserts) ----------
    def is_vendor_input_visible(self) -> bool:
        return self.page.get_by_placeholder(self.vendor_placeholder).is_visible()

    def is_search_button_visible(self) -> bool:
        return self.page.get_by_role(self.search_role, name=self.search_name).is_visible()

    def has_no_invoices_message(self) -> bool:
        return self.no_invoices_text.lower() in self.page.inner_text("body").lower()

    def is_no_invoices_visible(self) -> bool:
        return self.page.get_by_text(self.no_invoices_text).is_visible()

    def is_upload_now_visible(self) -> bool:
        return self.page.get_by_text(self.upload_now_text).is_visible()

    def is_local_history_visible(self) -> bool:
        self.page.wait_for_selector(f"text={self.local_history_text}", timeout=15000)
        return self.page.get_by_text(self.local_history_text).is_visible()

    def is_view_details_visible(self) -> bool:
        self.page.wait_for_selector(f"text={self.view_details_text}", timeout=15000)
        return self.page.get_by_text(self.view_details_text).first.is_visible()
