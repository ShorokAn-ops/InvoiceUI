from pathlib import Path

class UploadPage:
    def __init__(self, page, base_url: str):
        self.page = page
        self.base_url = base_url

        self.title_text = "text=Upload Invoice"
        self.file_input = "input[type='file']"
        self.upload_btn_text = "Upload & Extract Data"

        # allowed: verify page loaded
        self.page.wait_for_load_state("domcontentloaded")
        self.page.wait_for_selector(self.title_text, timeout=15000)
        self.page.wait_for_selector(self.file_input, timeout=15000)

    @classmethod
    def open(cls, page, base_url: str):
        page.goto(f"{base_url}/upload")
        return cls(page, base_url)

    def upload_invoice_pdf(self, pdf_path: Path):
        # no asserts here (assert stays in test) — but we can do safe waits
        file_input = self.page.locator(self.file_input).first
        file_input.wait_for(state="attached", timeout=15000)
        file_input.set_input_files(str(pdf_path))

        btn = self.page.get_by_text(self.upload_btn_text).first
        btn.wait_for(state="visible", timeout=15000)
        btn.click()

        # Wait for the upload button to not be in uploading state
        self.page.wait_for_load_state("networkidle", timeout=30000)
        
        # Give more time for backend processing and localStorage update
        self.page.wait_for_timeout(2000)
        return self
