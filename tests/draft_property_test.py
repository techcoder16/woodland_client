#!/usr/bin/env python3
"""
Draft Property Management Test Suite
===================================

This test suite specifically focuses on testing draft property functionality
and ensuring that draft properties don't appear in financial views.

Test Coverage:
- Create draft properties
- Edit draft properties
- Publish draft properties
- Verify draft properties are excluded from finance
- Test draft property filtering
- Test property status transitions

Run: python tests/draft_property_test.py
"""

import asyncio
import time
import json
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from test_selectors import *

class DraftPropertyTestSuite:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
        self.test_results = []
        self.created_properties = []
        self.start_time = None

    async def setup(self):
        """Initialize browser and context"""
        print("🚀 Starting Draft Property Test Suite...")
        self.start_time = datetime.now()
        
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            slow_mo=500  # Slower for better visibility
        )
        
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        
        self.page = await self.context.new_page()
        self.page.set_default_timeout(WAIT_TIMEOUTS['long'])
        
        print("✅ Browser setup complete")

    async def teardown(self):
        """Clean up browser resources"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        
        # Save test results
        await self.save_test_results()
        print("🧹 Cleanup complete")

    async def save_test_results(self):
        """Save test results to file"""
        results = {
            'test_suite': 'Draft Property Management Test Suite',
            'start_time': self.start_time.isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration': (datetime.now() - self.start_time).total_seconds(),
            'results': self.test_results,
            'created_properties': self.created_properties
        }
        
        with open('draft_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📊 Test results saved to draft_test_results.json")

    async def take_screenshot(self, name: str):
        """Take a screenshot for debugging"""
        try:
            screenshot_path = f"screenshots/draft_{name}_{int(time.time())}.png"
            os.makedirs('screenshots', exist_ok=True)
            await self.page.screenshot(path=screenshot_path)
            print(f"📸 Screenshot saved: {screenshot_path}")
        except Exception as e:
            print(f"⚠️ Screenshot failed: {e}")

    async def wait_for_element(self, selector: str, timeout: int = None):
        """Wait for element with error handling"""
        try:
            timeout = timeout or WAIT_TIMEOUTS['medium']
            await self.page.wait_for_selector(selector, timeout=timeout)
            return True
        except Exception as e:
            print(f"❌ Element not found: {selector} - {e}")
            await self.take_screenshot(f"missing_element_{selector.replace('[', '').replace(']', '')}")
            return False

    async def safe_click(self, selector: str, timeout: int = None):
        """Safely click element"""
        try:
            if await self.wait_for_element(selector, timeout):
                await self.page.click(selector)
                print(f"✅ Clicked: {selector}")
                return True
            return False
        except Exception as e:
            print(f"❌ Click failed: {selector} - {e}")
            await self.take_screenshot(f"click_failed_{selector.replace('[', '').replace(']', '')}")
            return False

    async def safe_fill(self, selector: str, value: str, timeout: int = None):
        """Safely fill input"""
        try:
            if await self.wait_for_element(selector, timeout):
                await self.page.fill(selector, value)
                print(f"✅ Filled: {selector} = {value}")
                return True
            return False
        except Exception as e:
            print(f"❌ Fill failed: {selector} - {e}")
            await self.take_screenshot(f"fill_failed_{selector.replace('[', '').replace(']', '')}")
            return False

    async def safe_select_option(self, selector: str, value: str, timeout: int = None):
        """Safely select option"""
        try:
            if await self.wait_for_element(selector, timeout):
                await self.page.select_option(selector, value)
                print(f"✅ Selected: {selector} = {value}")
                return True
            return False
        except Exception as e:
            print(f"❌ Select failed: {selector} - {e}")
            await self.take_screenshot(f"select_failed_{selector.replace('[', '').replace(']', '')}")
            return False

    async def login(self):
        """Login to the application"""
        test_name = "Login"
        start_time = datetime.now()
        
        try:
            print("🔐 Logging in...")
            
            await self.page.goto(f"{TEST_CONFIG['base_url']}/login")
            await self.wait_for_element(LOGIN_SELECTORS['email_input'])
            
            await self.safe_fill(LOGIN_SELECTORS['email_input'], TEST_CONFIG['login_email'])
            await self.safe_fill(LOGIN_SELECTORS['password_input'], TEST_CONFIG['login_password'])
            await self.safe_click(LOGIN_SELECTORS['submit_button'])
            
            await self.page.wait_for_url('**/dashboard', timeout=WAIT_TIMEOUTS['long'])
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'Login successful'
            })
            print("✅ Login successful")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Login failed: {e}")
            await self.take_screenshot("login_failed")
            raise

    async def navigate_to_properties(self):
        """Navigate to properties page"""
        test_name = "Navigate to Properties"
        start_time = datetime.now()
        
        try:
            print("🏠 Navigating to properties...")
            
            # Try multiple selectors for properties link
            selectors = [
                NAVIGATION_SELECTORS['properties_link'],
                NAVIGATION_SELECTORS['properties_link_alt'],
                'nav a:has-text("Properties")',
                '[data-testid="properties-link"]'
            ]
            
            navigated = False
            for selector in selectors:
                try:
                    if await self.safe_click(selector, WAIT_TIMEOUTS['short']):
                        navigated = True
                        break
                except:
                    continue
            
            if not navigated:
                raise Exception("Could not find properties navigation link")
            
            await self.page.wait_for_load_state('networkidle')
            await self.wait_for_element(NAVIGATION_SELECTORS['add_property_button'])
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'Navigation successful'
            })
            print("✅ Properties page loaded")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Navigation failed: {e}")
            await self.take_screenshot("navigation_failed")
            raise

    async def create_draft_property(self):
        """Create a draft property"""
        test_name = "Create Draft Property"
        start_time = datetime.now()
        
        try:
            print("📝 Creating draft property...")
            
            # Click Add Property button
            await self.safe_click(NAVIGATION_SELECTORS['add_property_button'])
            await self.page.wait_for_load_state('networkidle')
            
            # Fill basic information
            timestamp = int(time.time())
            property_name = f"Draft Property {timestamp}"
            
            await self.safe_fill(PROPERTY_FORM_SELECTORS['property_name'], property_name)
            await self.safe_fill(PROPERTY_FORM_SELECTORS['address_line1'], '123 Draft Street')
            await self.safe_fill(PROPERTY_FORM_SELECTORS['post_code'], 'SW1A 1AA')
            await self.safe_fill(PROPERTY_FORM_SELECTORS['town'], 'London')
            await self.safe_fill(PROPERTY_FORM_SELECTORS['price'], '200000')
            
            await self.safe_select_option(PROPERTY_FORM_SELECTORS['category'], 'residential')
            await self.safe_select_option(PROPERTY_FORM_SELECTORS['property_type'], 'Flat')
            await self.safe_select_option(PROPERTY_FORM_SELECTORS['for_sale_let'], 'sale')
            
            # Save as draft
            await self.safe_click(PROPERTY_FORM_SELECTORS['save_draft_button'])
            await self.page.wait_for_load_state('networkidle')
            
            # Store created property info
            self.created_properties.append({
                'name': property_name,
                'status': 'DRAFT',
                'created_at': datetime.now().isoformat()
            })
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'Draft property created successfully'
            })
            print("✅ Draft property created successfully")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Creating draft property failed: {e}")
            await self.take_screenshot("create_draft_failed")
            raise

    async def edit_draft_property(self):
        """Edit a draft property"""
        test_name = "Edit Draft Property"
        start_time = datetime.now()
        
        try:
            print("✏️ Editing draft property...")
            
            # Switch to draft tab if available
            draft_tab = await self.page.query_selector('button:has-text("Drafts")')
            if draft_tab:
                await draft_tab.click()
                await self.page.wait_for_load_state('networkidle')
            
            # Find and click edit button for draft property
            edit_buttons = await self.page.query_selector_all('button:has-text("Edit")')
            if edit_buttons:
                await edit_buttons[0].click()
                await self.page.wait_for_load_state('networkidle')
                
                # Make changes to draft
                await self.safe_fill(PROPERTY_FORM_SELECTORS['property_name'], 
                                   f"Draft Property {int(time.time())} - Edited")
                
                # Save as draft again
                await self.safe_click(PROPERTY_FORM_SELECTORS['save_draft_button'])
                await self.page.wait_for_load_state('networkidle')
                
                duration = (datetime.now() - start_time).total_seconds()
                self.test_results.append({
                    'test': test_name,
                    'success': True,
                    'duration': duration,
                    'message': 'Draft property edited successfully'
                })
                print("✅ Draft property edited successfully")
            else:
                raise Exception("No draft properties found to edit")
                
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Editing draft property failed: {e}")
            await self.take_screenshot("edit_draft_failed")
            raise

    async def publish_draft_property(self):
        """Publish a draft property"""
        test_name = "Publish Draft Property"
        start_time = datetime.now()
        
        try:
            print("📢 Publishing draft property...")
            
            # Switch to draft tab if available
            draft_tab = await self.page.query_selector('button:has-text("Drafts")')
            if draft_tab:
                await draft_tab.click()
                await self.page.wait_for_load_state('networkidle')
            
            # Find and click edit button for draft property
            edit_buttons = await self.page.query_selector_all('button:has-text("Edit")')
            if edit_buttons:
                await edit_buttons[0].click()
                await self.page.wait_for_load_state('networkidle')
                
                # Publish the draft
                await self.safe_click(PROPERTY_FORM_SELECTORS['publish_button'])
                await self.page.wait_for_load_state('networkidle')
                
                # Update created property status
                if self.created_properties:
                    self.created_properties[-1]['status'] = 'PUBLISHED'
                    self.created_properties[-1]['published_at'] = datetime.now().isoformat()
                
                duration = (datetime.now() - start_time).total_seconds()
                self.test_results.append({
                    'test': test_name,
                    'success': True,
                    'duration': duration,
                    'message': 'Draft property published successfully'
                })
                print("✅ Draft property published successfully")
            else:
                raise Exception("No draft properties found to publish")
                
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Publishing draft property failed: {e}")
            await self.take_screenshot("publish_draft_failed")
            raise

    async def test_draft_property_filtering(self):
        """Test that draft properties are filtered correctly"""
        test_name = "Test Draft Property Filtering"
        start_time = datetime.now()
        
        try:
            print("🔍 Testing draft property filtering...")
            
            # Navigate to properties page
            await self.navigate_to_properties()
            
            # Check if draft tab exists
            draft_tab = await self.page.query_selector('button:has-text("Drafts")')
            if draft_tab:
                await draft_tab.click()
                await self.page.wait_for_load_state('networkidle')
                
                # Verify draft properties are shown
                draft_properties = await self.page.query_selector_all('tbody tr')
                print(f"📊 Found {len(draft_properties)} draft properties")
                
                # Check if draft properties have correct status
                for i, row in enumerate(draft_properties):
                    status_cell = await row.query_selector('td:nth-child(5)')  # Property Status column
                    if status_cell:
                        status_text = await status_cell.text_content()
                        print(f"📋 Property {i+1} status: {status_text}")
            
            # Test published tab
            published_tab = await self.page.query_selector('button:has-text("Published")')
            if published_tab:
                await published_tab.click()
                await self.page.wait_for_load_state('networkidle')
                
                # Verify published properties are shown
                published_properties = await self.page.query_selector_all('tbody tr')
                print(f"📊 Found {len(published_properties)} published properties")
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'Draft property filtering test completed'
            })
            print("✅ Draft property filtering test completed")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Draft property filtering test failed: {e}")
            await self.take_screenshot("draft_filtering_failed")
            raise

    async def test_finance_exclusion(self):
        """Test that draft properties are excluded from finance views"""
        test_name = "Test Finance Exclusion"
        start_time = datetime.now()
        
        try:
            print("💰 Testing finance exclusion...")
            
            # Navigate to finance/property manager page
            finance_link = await self.page.query_selector('text=Finance, text=Property Manager, a[href*="finance"]')
            if finance_link:
                await finance_link.click()
                await self.page.wait_for_load_state('networkidle')
                
                # Check if draft properties are excluded
                property_cards = await self.page.query_selector_all('.property-card, tbody tr')
                print(f"📊 Found {len(property_cards)} properties in finance view")
                
                # Verify no draft properties are shown
                draft_count = 0
                for card in property_cards:
                    status_element = await card.query_selector('.status-badge, [class*="badge"]')
                    if status_element:
                        status_text = await status_element.text_content()
                        if 'DRAFT' in status_text.upper():
                            draft_count += 1
                
                if draft_count > 0:
                    raise Exception(f"Found {draft_count} draft properties in finance view")
                
                print("✅ No draft properties found in finance view")
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'Finance exclusion test completed'
            })
            print("✅ Finance exclusion test completed")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Finance exclusion test failed: {e}")
            await self.take_screenshot("finance_exclusion_failed")
            raise

    async def run_complete_draft_test_suite(self):
        """Run the complete draft property test suite"""
        try:
            await self.setup()
            await self.login()
            await self.navigate_to_properties()
            
            # Test 1: Create draft property
            await self.create_draft_property()
            await self.navigate_to_properties()
            
            # Test 2: Edit draft property
            await self.edit_draft_property()
            await self.navigate_to_properties()
            
            # Test 3: Test draft property filtering
            await self.test_draft_property_filtering()
            
            # Test 4: Publish draft property
            await self.publish_draft_property()
            await self.navigate_to_properties()
            
            # Test 5: Test finance exclusion
            await self.test_finance_exclusion()
            
            print("🎉 All draft property tests completed successfully!")
            
        except Exception as e:
            print(f"❌ Draft property test suite failed: {e}")
            raise
        finally:
            await self.teardown()

async def main():
    """Main function to run the draft property test suite"""
    test_suite = DraftPropertyTestSuite()
    await test_suite.run_complete_draft_test_suite()

if __name__ == "__main__":
    asyncio.run(main())
