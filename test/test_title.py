import unittest
from playwright.sync_api import sync_playwright


class TestInvParserUI(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Set up the browser once for all tests in this class."""
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=False)  # headless=False to see the browser
        
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests are done."""
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        """Set up before each test method."""
        self.page = self.browser.new_page()
    
    def tearDown(self):
        """Clean up after each test method."""
        self.page.close()

    def test_page_title(self):
        """Test that the page title is correct."""
        self.page.goto("http://localhost:3000")
        title = self.page.title()
        self.assertIn("invoice parser", title.lower())


if __name__ == "__main__":
    unittest.main()