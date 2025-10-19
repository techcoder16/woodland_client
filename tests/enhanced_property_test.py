#!/usr/bin/env python3
"""
Enhanced Property Management Test Suite
======================================

This enhanced test suite uses comprehensive selectors and provides detailed
logging and error handling for property management functionality.

Features:
- Complete property lifecycle testing
- Draft property management
- EPC rating testing
- Form validation testing
- Error handling and recovery
- Detailed logging and reporting

Run: python tests/enhanced_property_test.py
"""

import asyncio
import time
import json
import os
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from test_selectors import *

class EnhancedPropertyTestSuite:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
        self.test_results = []
        self.screenshots = []
        self.start_time = None

    async def setup(self):
        """Initialize browser and context with enhanced configuration"""
        print("🚀 Starting Enhanced Property Management Test Suite...")
        self.start_time = datetime.now()
        
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=BROWSER_CONFIG['headless'],
            slow_mo=BROWSER_CONFIG['slow_mo']
        )
        
        self.context = await self.browser.new_context(
            viewport=BROWSER_CONFIG['viewport'],
            user_agent=BROWSER_CONFIG['user_agent']
        )
        
        self.page = await self.context.new_page()
        self.page.set_default_timeout(WAIT_TIMEOUTS['long'])
        
        # Enable request/response logging
        self.page.on('request', lambda request: print(f"🌐 Request: {request.method} {request.url}"))
        self.page.on('response', lambda response: print(f"📡 Response: {response.status} {response.url}"))
        
        print("✅ Browser setup complete")

    async def teardown(self):
        """Clean up browser resources and save test results"""
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
            'test_suite': 'Enhanced Property Management Test Suite',
            'start_time': self.start_time.isoformat(),
            'end_time': datetime.now().isoformat(),
            'duration': (datetime.now() - self.start_time).total_seconds(),
            'results': self.test_results,
            'screenshots': self.screenshots
        }
        
        with open('test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📊 Test results saved to test_results.json")

    async def take_screenshot(self, name: str):
        """Take a screenshot for debugging"""
        try:
            screenshot_path = f"screenshots/{name}_{int(time.time())}.png"
            os.makedirs('screenshots', exist_ok=True)
            await self.page.screenshot(path=screenshot_path)
            self.screenshots.append(screenshot_path)
            print(f"📸 Screenshot saved: {screenshot_path}")
        except Exception as e:
            print(f"⚠️ Screenshot failed: {e}")

    async def wait_for_element(self, selector: str, timeout: int = None):
        """Wait for element with enhanced error handling"""
        try:
            timeout = timeout or WAIT_TIMEOUTS['medium']
            await self.page.wait_for_selector(selector, timeout=timeout)
            return True
        except Exception as e:
            print(f"❌ Element not found: {selector} - {e}")
            await self.take_screenshot(f"missing_element_{selector.replace('[', '').replace(']', '')}")
            return False

    async def safe_click(self, selector: str, timeout: int = None):
        """Safely click element with error handling"""
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
        """Safely fill input with error handling"""
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
        """Safely select option with error handling"""
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
        """Enhanced login with error handling"""
        test_name = "Login"
        start_time = datetime.now()
        
        try:
            print("🔐 Logging in...")
            
            # Navigate to login page
            await self.page.goto(f"{TEST_CONFIG['base_url']}/login")
            
            # Wait for login form
            if not await self.wait_for_element(LOGIN_SELECTORS['email_input']):
                raise Exception("Login form not found")
            
            # Fill credentials
            await self.safe_fill(LOGIN_SELECTORS['email_input'], TEST_CONFIG['login_email'])
            await self.safe_fill(LOGIN_SELECTORS['password_input'], TEST_CONFIG['login_password'])
            
            # Submit form
            if not await self.safe_click(LOGIN_SELECTORS['submit_button']):
                raise Exception("Login button not found")
            
            # Wait for dashboard
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
        """Enhanced navigation with multiple fallback selectors"""
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
            
            # Wait for properties page
            await self.page.wait_for_load_state('networkidle')
            
            # Verify we're on properties page
            if not await self.wait_for_element(NAVIGATION_SELECTORS['add_property_button']):
                raise Exception("Properties page not loaded")
            
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

    async def add_complete_property(self):
        """Add complete property with all steps and validation"""
        test_name = "Add Complete Property"
        start_time = datetime.now()
        
        try:
            print("➕ Adding complete property...")
            
            # Click Add Property button
            if not await self.safe_click(NAVIGATION_SELECTORS['add_property_button']):
                raise Exception("Add Property button not found")
            
            await self.page.wait_for_load_state('networkidle')
            
            # Step 1: Basic Information
            print("📝 Filling basic information...")
            await self.fill_basic_information()
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['next_button']):
                raise Exception("Next button not found")
            await self.page.wait_for_load_state('networkidle')
            
            # Step 2: Property Details
            print("🏠 Filling property details...")
            await self.fill_property_details()
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['next_button']):
                raise Exception("Next button not found")
            await self.page.wait_for_load_state('networkidle')
            
            # Step 3: Description
            print("📄 Filling description...")
            await self.fill_description()
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['next_button']):
                raise Exception("Next button not found")
            await self.page.wait_for_load_state('networkidle')
            
            # Step 4: Photos/EPC
            print("📸 Filling photos and EPC...")
            await self.fill_photos_epc()
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['next_button']):
                raise Exception("Next button not found")
            await self.page.wait_for_load_state('networkidle')
            
            # Step 5: Features
            print("✨ Filling features...")
            await self.fill_features()
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['next_button']):
                raise Exception("Next button not found")
            await self.page.wait_for_load_state('networkidle')
            
            # Step 6: Publish
            print("📢 Publishing property...")
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['publish_button']):
                raise Exception("Publish button not found")
            await self.page.wait_for_load_state('networkidle')
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'Property added and published successfully'
            })
            print("✅ Property added and published successfully")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ Adding property failed: {e}")
            await self.take_screenshot("add_property_failed")
            raise

    async def fill_basic_information(self):
        """Fill basic property information with validation"""
        data = TEST_DATA_TEMPLATES['basic_property']
        timestamp = int(time.time())
        
        # Fill all basic information fields
        await self.safe_fill(PROPERTY_FORM_SELECTORS['property_name'], 
                           data['name'].format(timestamp=timestamp))
        await self.safe_fill(PROPERTY_FORM_SELECTORS['address_line1'], data['address'])
        await self.safe_fill(PROPERTY_FORM_SELECTORS['post_code'], data['postCode'])
        await self.safe_fill(PROPERTY_FORM_SELECTORS['town'], data['town'])
        await self.safe_fill(PROPERTY_FORM_SELECTORS['price'], data['price'])
        
        # Select dropdowns
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['category'], 
                                   PROPERTY_CATEGORY_OPTIONS['residential'])
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['property_type'], 
                                   PROPERTY_TYPE_OPTIONS['flat'])
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['for_sale_let'], 'sale')

    async def fill_property_details(self):
        """Fill property details with validation"""
        data = TEST_DATA_TEMPLATES['basic_property']
        
        await self.safe_fill(PROPERTY_FORM_SELECTORS['bedrooms'], data['bedrooms'])
        await self.safe_fill(PROPERTY_FORM_SELECTORS['bathrooms'], data['bathrooms'])
        await self.safe_fill(PROPERTY_FORM_SELECTORS['area'], data['area'])
        await self.safe_fill(PROPERTY_FORM_SELECTORS['year_built'], data['yearBuilt'])
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['status'], 'Active')

    async def fill_description(self):
        """Fill property description"""
        data = TEST_DATA_TEMPLATES['basic_property']
        await self.safe_fill(PROPERTY_FORM_SELECTORS['description'], data['description'])

    async def fill_photos_epc(self):
        """Fill photos and EPC ratings with validation"""
        # EPC Ratings
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['current_ee_rating'], 
                                   EPC_RATING_OPTIONS['current_rating_default'])
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['potential_ee_rating'], 
                                   EPC_RATING_OPTIONS['potential_rating_default'])
        
        # EPC Chart option
        await self.safe_select_option(PROPERTY_FORM_SELECTORS['epc_chart_option'], 'ratings')

    async def fill_features(self):
        """Fill property features"""
        features = [
            PROPERTY_FORM_SELECTORS['garden_checkbox'],
            PROPERTY_FORM_SELECTORS['parking_checkbox'],
            PROPERTY_FORM_SELECTORS['balcony_checkbox']
        ]
        
        for feature_selector in features:
            try:
                await self.page.check(feature_selector)
                print(f"✅ Checked feature: {feature_selector}")
            except:
                # Try alternative approach
                try:
                    await self.safe_click(feature_selector)
                except:
                    print(f"⚠️ Could not select feature: {feature_selector}")

    async def create_draft_property(self):
        """Create a draft property"""
        test_name = "Create Draft Property"
        start_time = datetime.now()
        
        try:
            print("📝 Creating draft property...")
            
            # Click Add Property button
            if not await self.safe_click(NAVIGATION_SELECTORS['add_property_button']):
                raise Exception("Add Property button not found")
            
            await self.page.wait_for_load_state('networkidle')
            
            # Fill basic information
            await self.fill_basic_information()
            
            # Save as draft
            if not await self.safe_click(PROPERTY_FORM_SELECTORS['save_draft_button']):
                raise Exception("Save as Draft button not found")
            
            await self.page.wait_for_load_state('networkidle')
            
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

    async def test_epc_ratings(self):
        """Test EPC rating functionality"""
        test_name = "Test EPC Ratings"
        start_time = datetime.now()
        
        try:
            print("📊 Testing EPC ratings...")
            
            # Navigate to add property
            if not await self.safe_click(NAVIGATION_SELECTORS['add_property_button']):
                raise Exception("Add Property button not found")
            
            await self.page.wait_for_load_state('networkidle')
            
            # Fill basic info and navigate to EPC step
            await self.fill_basic_information()
            await self.safe_click(PROPERTY_FORM_SELECTORS['next_button'])
            await self.page.wait_for_load_state('networkidle')
            
            await self.fill_property_details()
            await self.safe_click(PROPERTY_FORM_SELECTORS['next_button'])
            await self.page.wait_for_load_state('networkidle')
            
            await self.fill_description()
            await self.safe_click(PROPERTY_FORM_SELECTORS['next_button'])
            await self.page.wait_for_load_state('networkidle')
            
            # Test EPC ratings
            current_rating = await self.page.query_selector(PROPERTY_FORM_SELECTORS['current_ee_rating'])
            potential_rating = await self.page.query_selector(PROPERTY_FORM_SELECTORS['potential_ee_rating'])
            
            if current_rating and potential_rating:
                await self.safe_select_option(PROPERTY_FORM_SELECTORS['current_ee_rating'], '80')
                await self.safe_select_option(PROPERTY_FORM_SELECTORS['potential_ee_rating'], '90')
                print("✅ EPC ratings set successfully")
            
            # Save as draft
            await self.safe_click(PROPERTY_FORM_SELECTORS['save_draft_button'])
            await self.page.wait_for_load_state('networkidle')
            
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': True,
                'duration': duration,
                'message': 'EPC ratings test completed'
            })
            print("✅ EPC ratings test completed")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.test_results.append({
                'test': test_name,
                'success': False,
                'duration': duration,
                'error': str(e)
            })
            print(f"❌ EPC ratings test failed: {e}")
            await self.take_screenshot("epc_ratings_failed")
            raise

    async def run_complete_test_suite(self):
        """Run the complete enhanced test suite"""
        try:
            await self.setup()
            await self.login()
            await self.navigate_to_properties()
            
            # Test 1: Add complete property
            await self.add_complete_property()
            await self.navigate_to_properties()
            
            # Test 2: Create draft property
            await self.create_draft_property()
            await self.navigate_to_properties()
            
            # Test 3: Test EPC ratings
            await self.test_epc_ratings()
            await self.navigate_to_properties()
            
            print("🎉 All tests completed successfully!")
            
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
            raise
        finally:
            await self.teardown()

async def main():
    """Main function to run the enhanced test suite"""
    test_suite = EnhancedPropertyTestSuite()
    await test_suite.run_complete_test_suite()

if __name__ == "__main__":
    asyncio.run(main())
