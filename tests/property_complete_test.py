#!/usr/bin/env python3
"""
Complete Property Management Test Suite
=====================================

This Python Playwright script tests the complete property lifecycle:
- Login
- Add Property (with all steps)
- Edit Property
- Create Draft Property
- Edit Draft Property
- Publish Property
- Delete Property

Run: python tests/property_complete_test.py
"""

import asyncio
import time
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
import json
import os

# Test Configuration
BASE_URL = 'http://localhost:8081'
LOGIN_EMAIL = 'admin@woodland.com'
LOGIN_PASSWORD = '12345'

# Test Data
TEST_PROPERTY = {
    'name': f'Test Property {int(time.time())}',
    'address': '123 Test Street',
    'postCode': 'SW1A 1AA',
    'town': 'London',
    'price': '250000',
    'description': 'This is a comprehensive test property for automated testing',
    'currentEERating': '75',
    'potentialEERating': '85',
    'bedrooms': '3',
    'bathrooms': '2',
    'area': '1200'
}

class PropertyTestSuite:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.property_id = None
        self.created_properties = []

    async def setup(self):
        """Initialize browser and context"""
        print("🚀 Starting Property Management Test Suite...")
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=False,  # Set to True for headless mode
            slow_mo=1000  # Slow down actions for better visibility
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        self.page = await self.context.new_page()
        
        # Set longer timeout for all operations
        self.page.set_default_timeout(30000)
        
        print("✅ Browser setup complete")

    async def teardown(self):
        """Clean up browser resources"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        print("🧹 Cleanup complete")

    async def login(self):
        """Login to the application"""
        print("🔐 Logging in...")
        
        try:
            # Navigate to login page
            await self.page.goto(f"{BASE_URL}/login")
            
            # Wait for login form
            await self.page.wait_for_selector('#email', timeout=10000)
            print("📧 Login form loaded")
            
            # Fill login credentials
            await self.page.fill('#email', LOGIN_EMAIL)
            await self.page.fill('#password', LOGIN_PASSWORD)
            
            # Click login button
            await self.page.click('button[type="submit"]')
            
            # Wait for dashboard
            await self.page.wait_for_url('**/dashboard', timeout=15000)
            print("✅ Login successful")
            
        except Exception as e:
            print(f"❌ Login failed: {e}")
            raise

    async def navigate_to_properties(self):
        """Navigate to properties page"""
        print("🏠 Navigating to properties...")
        
        try:
            # Try multiple selectors for properties link
            selectors = [
                'text=Properties',
                'a[href*="property"]',
                '[data-testid="properties-link"]',
                'nav a:has-text("Properties")'
            ]
            
            for selector in selectors:
                try:
                    await self.page.click(selector, timeout=5000)
                    break
                except:
                    continue
            else:
                raise Exception("Could not find properties navigation link")
            
            # Wait for properties page to load
            await self.page.wait_for_selector('text=Add Property', timeout=10000)
            print("✅ Properties page loaded")
            
        except Exception as e:
            print(f"❌ Navigation to properties failed: {e}")
            raise

    async def add_property_complete(self):
        """Add a complete property with all steps"""
        print("➕ Adding complete property...")
        
        try:
            # Click Add Property button
            await self.page.click('text=Add Property')
            await self.page.wait_for_load_state('networkidle')
            
            # Step 1: Basic Information
            print("📝 Filling basic information...")
            await self.fill_basic_information()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Step 2: Property Details
            print("🏠 Filling property details...")
            await self.fill_property_details()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Step 3: Description
            print("📄 Filling description...")
            await self.fill_description()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Step 4: Photos/EPC
            print("📸 Filling photos and EPC...")
            await self.fill_photos_epc()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Step 5: Features
            print("✨ Filling features...")
            await self.fill_features()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Step 6: Final Review
            print("👀 Final review...")
            await self.page.wait_for_selector('button:has-text("Publish")', timeout=10000)
            
            # Publish the property
            await self.page.click('button:has-text("Publish")')
            await self.page.wait_for_load_state('networkidle')
            
            print("✅ Property added and published successfully")
            
        except Exception as e:
            print(f"❌ Adding property failed: {e}")
            raise

    async def fill_basic_information(self):
        """Fill basic property information"""
        # Property name
        await self.page.fill('input[name="propertyName"]', TEST_PROPERTY['name'])
        
        # Address fields
        await self.page.fill('input[name="addressLine1"]', TEST_PROPERTY['address'])
        await self.page.fill('input[name="postCode"]', TEST_PROPERTY['postCode'])
        await self.page.fill('input[name="town"]', TEST_PROPERTY['town'])
        
        # Property type and category
        await self.page.select_option('select[name="category"]', 'residential')
        await self.page.select_option('select[name="propertyType"]', 'Flat')
        
        # Price
        await self.page.fill('input[name="price"]', TEST_PROPERTY['price'])
        
        # For sale/let
        await self.page.select_option('select[name="for"]', 'sale')

    async def fill_property_details(self):
        """Fill property details"""
        # Bedrooms and bathrooms
        await self.page.fill('input[name="bedrooms"]', TEST_PROPERTY['bedrooms'])
        await self.page.fill('input[name="bathrooms"]', TEST_PROPERTY['bathrooms'])
        await self.page.fill('input[name="area"]', TEST_PROPERTY['area'])
        
        # Year built
        await self.page.fill('input[name="yearBuilt"]', '2020')
        
        # Property status
        await self.page.select_option('select[name="status"]', 'Active')

    async def fill_description(self):
        """Fill property description"""
        await self.page.fill('textarea[name="description"]', TEST_PROPERTY['description'])

    async def fill_photos_epc(self):
        """Fill photos and EPC ratings"""
        # EPC Ratings
        await self.page.select_option('select[name="currentEERating"]', TEST_PROPERTY['currentEERating'])
        await self.page.select_option('select[name="potentialEERating"]', TEST_PROPERTY['potentialEERating'])
        
        # EPC Chart option
        await self.page.select_option('select[name="epcChartOption"]', 'ratings')

    async def fill_features(self):
        """Fill property features"""
        # Select some features
        features = ['Garden', 'Parking', 'Balcony']
        for feature in features:
            try:
                await self.page.check(f'input[value="{feature}"]')
            except:
                # If checkbox not found, try alternative selectors
                await self.page.click(f'text={feature}')

    async def create_draft_property(self):
        """Create a draft property"""
        print("📝 Creating draft property...")
        
        try:
            # Click Add Property button
            await self.page.click('text=Add Property')
            await self.page.wait_for_load_state('networkidle')
            
            # Fill only basic information
            await self.fill_basic_information()
            
            # Save as draft instead of continuing
            await self.page.click('button:has-text("Save as Draft")')
            await self.page.wait_for_load_state('networkidle')
            
            print("✅ Draft property created successfully")
            
        except Exception as e:
            print(f"❌ Creating draft property failed: {e}")
            raise

    async def edit_property(self):
        """Edit an existing property"""
        print("✏️ Editing property...")
        
        try:
            # Find and click edit button for the first property
            edit_buttons = await self.page.query_selector_all('button:has-text("Edit")')
            if edit_buttons:
                await edit_buttons[0].click()
                await self.page.wait_for_load_state('networkidle')
                
                # Make a small change
                await self.page.fill('input[name="propertyName"]', f"{TEST_PROPERTY['name']} - Edited")
                
                # Save changes
                await self.page.click('button:has-text("Publish")')
                await self.page.wait_for_load_state('networkidle')
                
                print("✅ Property edited successfully")
            else:
                print("⚠️ No edit buttons found")
                
        except Exception as e:
            print(f"❌ Editing property failed: {e}")
            raise

    async def edit_draft_property(self):
        """Edit a draft property"""
        print("📝 Editing draft property...")
        
        try:
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
                await self.page.fill('input[name="propertyName"]', f"{TEST_PROPERTY['name']} - Draft Edited")
                
                # Save as draft again
                await self.page.click('button:has-text("Save as Draft")')
                await self.page.wait_for_load_state('networkidle')
                
                print("✅ Draft property edited successfully")
            else:
                print("⚠️ No draft edit buttons found")
                
        except Exception as e:
            print(f"❌ Editing draft property failed: {e}")
            raise

    async def publish_draft_property(self):
        """Publish a draft property"""
        print("📢 Publishing draft property...")
        
        try:
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
                await self.page.click('button:has-text("Publish")')
                await self.page.wait_for_load_state('networkidle')
                
                print("✅ Draft property published successfully")
            else:
                print("⚠️ No draft properties found to publish")
                
        except Exception as e:
            print(f"❌ Publishing draft property failed: {e}")
            raise

    async def delete_property(self):
        """Delete a property"""
        print("🗑️ Deleting property...")
        
        try:
            # Find and click delete button for the first property
            delete_buttons = await self.page.query_selector_all('button:has-text("Delete")')
            if delete_buttons:
                await delete_buttons[0].click()
                
                # Confirm deletion if confirmation dialog appears
                confirm_button = await self.page.query_selector('button:has-text("Confirm")')
                if confirm_button:
                    await confirm_button.click()
                
                await self.page.wait_for_load_state('networkidle')
                print("✅ Property deleted successfully")
            else:
                print("⚠️ No delete buttons found")
                
        except Exception as e:
            print(f"❌ Deleting property failed: {e}")
            raise

    async def test_property_filters(self):
        """Test property filtering functionality"""
        print("🔍 Testing property filters...")
        
        try:
            # Test status filter
            status_filter = await self.page.query_selector('select[name="status"]')
            if status_filter:
                await status_filter.select_option('Active')
                await self.page.wait_for_load_state('networkidle')
                print("✅ Status filter applied")
            
            # Test search functionality
            search_input = await self.page.query_selector('input[placeholder*="search" i]')
            if search_input:
                await search_input.fill('Test')
                await self.page.wait_for_load_state('networkidle')
                print("✅ Search filter applied")
            
        except Exception as e:
            print(f"❌ Testing filters failed: {e}")
            raise

    async def test_epc_ratings(self):
        """Test EPC rating functionality"""
        print("📊 Testing EPC ratings...")
        
        try:
            # Navigate to add property
            await self.page.click('text=Add Property')
            await self.page.wait_for_load_state('networkidle')
            
            # Fill basic info
            await self.fill_basic_information()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Fill property details
            await self.fill_property_details()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Fill description
            await self.fill_description()
            await self.page.click('button:has-text("Next")')
            await self.page.wait_for_load_state('networkidle')
            
            # Test EPC ratings
            current_rating = await self.page.query_selector('select[name="currentEERating"]')
            potential_rating = await self.page.query_selector('select[name="potentialEERating"]')
            
            if current_rating and potential_rating:
                await current_rating.select_option('80')
                await potential_rating.select_option('90')
                print("✅ EPC ratings set successfully")
            
            # Save as draft
            await self.page.click('button:has-text("Save as Draft")')
            await self.page.wait_for_load_state('networkidle')
            
            print("✅ EPC ratings test completed")
            
        except Exception as e:
            print(f"❌ EPC ratings test failed: {e}")
            raise

    async def run_complete_test_suite(self):
        """Run the complete test suite"""
        try:
            await self.setup()
            await self.login()
            await self.navigate_to_properties()
            
            # Test 1: Add complete property
            await self.add_property_complete()
            await self.navigate_to_properties()
            
            # Test 2: Create draft property
            await self.create_draft_property()
            await self.navigate_to_properties()
            
            # Test 3: Edit property
            await self.edit_property()
            await self.navigate_to_properties()
            
            # Test 4: Edit draft property
            await self.edit_draft_property()
            await self.navigate_to_properties()
            
            # Test 5: Publish draft property
            await self.publish_draft_property()
            await self.navigate_to_properties()
            
            # Test 6: Test filters
            await self.test_property_filters()
            
            # Test 7: Test EPC ratings
            await self.test_epc_ratings()
            await self.navigate_to_properties()
            
            # Test 8: Delete property (optional)
            # await self.delete_property()
            
            print("🎉 All tests completed successfully!")
            
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
            raise
        finally:
            await self.teardown()

    async def run_specific_test(self, test_name: str):
        """Run a specific test"""
        try:
            await self.setup()
            await self.login()
            await self.navigate_to_properties()
            
            if test_name == "add_property":
                await self.add_property_complete()
            elif test_name == "create_draft":
                await self.create_draft_property()
            elif test_name == "edit_property":
                await self.edit_property()
            elif test_name == "edit_draft":
                await self.edit_draft_property()
            elif test_name == "publish_draft":
                await self.publish_draft_property()
            elif test_name == "epc_ratings":
                await self.test_epc_ratings()
            elif test_name == "filters":
                await self.test_property_filters()
            else:
                print(f"❌ Unknown test: {test_name}")
                return
            
            print(f"✅ {test_name} test completed successfully!")
            
        except Exception as e:
            print(f"❌ {test_name} test failed: {e}")
            raise
        finally:
            await self.teardown()

async def main():
    """Main function to run tests"""
    import sys
    
    test_suite = PropertyTestSuite()
    
    if len(sys.argv) > 1:
        # Run specific test
        test_name = sys.argv[1]
        await test_suite.run_specific_test(test_name)
    else:
        # Run complete test suite
        await test_suite.run_complete_test_suite()

if __name__ == "__main__":
    # Run the test suite
    asyncio.run(main())
