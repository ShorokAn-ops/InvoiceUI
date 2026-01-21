import os
from playwright.sync_api import sync_playwright, Browser, Page

class BrowserFactory:
    def __init__(self):
        self.browser_type = os.getenv('BROWSER', 'chrome')
        self.width = int(os.getenv('SCREEN_WIDTH', '1920'))
        self.height = int(os.getenv('SCREEN_HEIGHT', '1080'))
        self.headless = os.getenv('HEADLESS', 'false').lower() == 'true'
        self.playwright = None
        self.browser = None
    
    def create_browser(self) -> Browser:
        self.playwright = sync_playwright().start()
        
        if self.browser_type == 'chrome':
            self.browser = self.playwright.chromium.launch(headless=self.headless)
        elif self.browser_type == 'firefox':
            self.browser = self.playwright.firefox.launch(headless=self.headless)
        else:
            raise ValueError(f"Unsupported browser: {self.browser_type}")
        
        return self.browser
    
    def create_page(self) -> Page:
        if not self.browser:
            self.create_browser()
        
        context = self.browser.new_context(
            viewport={'width': self.width, 'height': self.height}
        )
        page = context.new_page()
        return page
    
    def close(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

# Usage in your tests
def get_page():
    factory = BrowserFactory()
    return factory.create_page()