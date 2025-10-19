/**
 * Property Management End-to-End Tests
 * 
 * These tests open the browser, log in, and test the property functionality
 * like a real user would.
 * 
 * Run: npm run test:e2e
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8081';
const LOGIN_EMAIL = 'admin@woodland.com';
const LOGIN_PASSWORD = '12345';

// Test data
const TEST_PROPERTY = {
  name: `Test Property ${Date.now()}`,
  address: '123 Test Street',
  postCode: 'SW1A 1AA',
  town: 'London',
  price: '250000',
  description: 'This is a test property for automated testing',
  currentEERating: '75',
  potentialEERating: '85',
};

// Helper functions
async function login(page: Page) {
  console.log('🔐 Logging in...');
  
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);
  
  // Wait for login form to load
  await page.waitForSelector('#email', { timeout: 10000 });
  
  // Fill login form using the correct selectors
  await page.fill('#email', LOGIN_EMAIL);
  await page.fill('#password', LOGIN_PASSWORD);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  
  console.log('✅ Login successful');
}

async function navigateToProperties(page: Page) {
  console.log('🏠 Navigating to properties...');
  
  // Click on Properties in navigation (try multiple possible selectors)
  try {
    await page.click('text=Properties', { timeout: 5000 });
  } catch {
    // Try alternative selectors
    await page.click('a[href*="property"]', { timeout: 5000 });
  }
  
  // Wait for properties page to load (try multiple possible selectors)
  try {
    await page.waitForSelector('[data-testid="property-list"]', { timeout: 10000 });
  } catch {
    // Try alternative selectors
    await page.waitForSelector('text=Add Property', { timeout: 10000 });
  }
  
  console.log('✅ Properties page loaded');
}

async function createProperty(page: Page) {
  console.log('📝 Creating new property...');
  
  // Click Add Property button
  await page.click('text=Add Property');
  
  // Wait for form to load
  await page.waitForSelector('form', { timeout: 15000 });
  
  // Fill basic information with more robust selectors
  await page.selectOption('select[name="for"]', 'sale');
  await page.selectOption('select[name="category"]', 'residential');
  await page.selectOption('select[name="propertyType"]', 'Flat');
  await page.fill('input[name="propertyName"]', TEST_PROPERTY.name);
  await page.fill('input[name="postCode"]', TEST_PROPERTY.postCode);
  await page.fill('input[name="town"]', TEST_PROPERTY.town);
  await page.fill('input[name="price_input"]', TEST_PROPERTY.price);
  
  console.log('✅ Basic information filled');
  
  // Save as draft
  await page.click('button:has-text("Save as Draft")');
  
  // Wait for success message or redirect (try multiple possible messages)
  try {
    await page.waitForSelector('text=Property created successfully', { timeout: 10000 });
  } catch {
    // Try alternative success messages
    await page.waitForSelector('text=Property saved', { timeout: 5000 });
  }
  
  console.log('✅ Property created as draft');
}

async function testDraftFunctionality(page: Page) {
  console.log('📋 Testing draft functionality...');
  
  // Navigate to properties list
  await navigateToProperties(page);
  
  // Switch to drafts tab
  await page.click('text=Drafts');
  
  // Find the created property
  const propertyRow = page.locator(`tr:has-text("${TEST_PROPERTY.name}")`);
  await expect(propertyRow).toBeVisible();
  
  // Verify it shows as DRAFT
  await expect(propertyRow.locator('text=DRAFT')).toBeVisible();
  
  console.log('✅ Draft property found in drafts tab');
  
  // Click Edit Draft
  await propertyRow.locator('button:has-text("Edit Draft")').click();
  
  // Wait for edit form
  await page.waitForSelector('form', { timeout: 10000 });
  
  console.log('✅ Edit draft form opened');
}

async function testEPCRatings(page: Page) {
  console.log('⚡ Testing EPC ratings...');
  
  // Navigate to Photos/Floor/FPC Plan step
  await page.click('text=Photos/Floor/FPC Plan');
  
  // Wait for the step to load
  await page.waitForSelector('text=Current Energy Efficiency Rating', { timeout: 10000 });
  
  // Test EPC Chart Option
  await page.selectOption('select[name="epcChartOption"]', 'ratings');
  
  // Wait for EPC rating fields to appear
  await page.waitForSelector('select[name="currentEERating"]', { timeout: 5000 });
  
  // Change Current EPC Rating
  await page.selectOption('select[name="currentEERating"]', TEST_PROPERTY.currentEERating);
  
  // Change Potential EPC Rating
  await page.selectOption('select[name="potentialEERating"]', TEST_PROPERTY.potentialEERating);
  
  console.log('✅ EPC ratings set');
  
  // Navigate to next step and back to verify persistence
  await page.click('text=Attachments');
  await page.waitForTimeout(1000);
  await page.click('text=Photos/Floor/FPC Plan');
  
  // Verify values persisted
  const currentRating = await page.inputValue('select[name="currentEERating"]');
  const potentialRating = await page.inputValue('select[name="potentialEERating"]');
  
  expect(currentRating).toBe(TEST_PROPERTY.currentEERating);
  expect(potentialRating).toBe(TEST_PROPERTY.potentialEERating);
  
  console.log('✅ EPC ratings persisted correctly');
}

async function testPublishDraft(page: Page) {
  console.log('🚀 Testing publish draft...');
  
  // Navigate to final step
  await page.click('text=Publish');
  
  // Fill required fields for publishing
  await page.fill('textarea[name="shortSummary"]', 'Short summary for testing');
  await page.fill('textarea[name="fullDescription"]', TEST_PROPERTY.description);
  
  // Click Update & Publish
  await page.click('button:has-text("Update & Publish")');
  
  // Wait for success message
  await page.waitForSelector('text=Property published successfully', { timeout: 10000 });
  
  console.log('✅ Draft published successfully');
}

async function verifyPublishedProperty(page: Page) {
  console.log('✅ Verifying published property...');
  
  // Navigate back to properties
  await navigateToProperties(page);
  
  // Switch to Published tab
  await page.click('text=Published');
  
  // Find the property
  const propertyRow = page.locator(`tr:has-text("${TEST_PROPERTY.name}")`);
  await expect(propertyRow).toBeVisible();
  
  // Verify it shows as PUBLISHED
  await expect(propertyRow.locator('text=PUBLISHED')).toBeVisible();
  
  console.log('✅ Property verified as published');
}

async function testEditPublishedProperty(page: Page) {
  console.log('✏️ Testing edit published property...');
  
  // Click Edit on published property
  await page.click('button:has-text("Edit")');
  
  // Wait for edit form
  await page.waitForSelector('form', { timeout: 10000 });
  
  // Verify NO "Save as Draft" button is visible
  await expect(page.locator('button:has-text("Save as Draft")')).not.toBeVisible();
  
  // Navigate to EPC ratings step
  await page.click('text=Photos/Floor/FPC Plan');
  
  // Change EPC ratings
  await page.selectOption('select[name="currentEERating"]', '80');
  await page.selectOption('select[name="potentialEERating"]', '90');
  
  // Click Update Property
  await page.click('button:has-text("Update Property")');
  
  // Wait for success message
  await page.waitForSelector('text=Property updated successfully', { timeout: 10000 });
  
  console.log('✅ Published property edited successfully');
}

async function testDeleteProperty(page: Page) {
  console.log('🗑️ Testing delete property...');
  
  // Navigate to properties
  await navigateToProperties(page);
  
  // Find the property
  const propertyRow = page.locator(`tr:has-text("${TEST_PROPERTY.name}")`);
  
  // Click delete button
  await propertyRow.locator('button[aria-label="Delete"]').click();
  
  // Confirm deletion
  await page.click('button:has-text("Delete")');
  
  // Wait for success message
  await page.waitForSelector('text=Property deleted successfully', { timeout: 10000 });
  
  // Verify property is gone
  await expect(propertyRow).not.toBeVisible();
  
  console.log('✅ Property deleted successfully');
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Property Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for all tests
    test.setTimeout(60000);
  });

  test('Complete Property Lifecycle', async ({ page }) => {
    console.log('🚀 Starting complete property lifecycle test...\n');
    
    // Step 1: Login
    await login(page);
    
    // Step 2: Navigate to properties
    await navigateToProperties(page);
    
    // Step 3: Create property as draft
    await createProperty(page);
    
    // Step 4: Test draft functionality
    await testDraftFunctionality(page);
    
    // Step 5: Test EPC ratings
    await testEPCRatings(page);
    
    // Step 6: Publish draft
    await testPublishDraft(page);
    
    // Step 7: Verify published property
    await verifyPublishedProperty(page);
    
    // Step 8: Test edit published property
    await testEditPublishedProperty(page);
    
    // Step 9: Delete property
    await testDeleteProperty(page);
    
    console.log('\n🎉 All tests completed successfully!');
  });

  test('Draft Functionality on Each Step', async ({ page }) => {
    console.log('📝 Testing draft functionality on each step...\n');
    
    await login(page);
    await navigateToProperties(page);
    
    // Create property
    await page.click('text=Add Property');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill step 1 and save as draft
    await page.selectOption('select[name="for"]', 'sale');
    await page.fill('input[name="propertyName"]', `Step 1 Draft ${Date.now()}`);
    await page.click('button:has-text("Save as Draft")');
    await page.waitForSelector('text=Property created successfully', { timeout: 10000 });
    
    console.log('✅ Step 1 draft saved');
    
    // Edit draft and test step 2
    await navigateToProperties(page);
    await page.click('text=Drafts');
    await page.click('button:has-text("Edit Draft")');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.click('text=Description');
    await page.fill('textarea[name="shortSummary"]', 'Step 2 test');
    await page.click('button:has-text("Save as Draft")');
    await page.waitForSelector('text=Property updated successfully', { timeout: 10000 });
    
    console.log('✅ Step 2 draft saved');
    
    // Test step 3
    await page.click('text=More Info');
    await page.fill('input[name="yearOfBuild"]', '2020');
    await page.click('button:has-text("Save as Draft")');
    await page.waitForSelector('text=Property updated successfully', { timeout: 10000 });
    
    console.log('✅ Step 3 draft saved');
    
    // Test step 4 (EPC ratings)
    await page.click('text=Photos/Floor/FPC Plan');
    await page.selectOption('select[name="epcChartOption"]', 'ratings');
    await page.waitForSelector('select[name="currentEERating"]', { timeout: 5000 });
    await page.selectOption('select[name="currentEERating"]', '70');
    await page.selectOption('select[name="potentialEERating"]', '80');
    await page.click('button:has-text("Save as Draft")');
    await page.waitForSelector('text=Property updated successfully', { timeout: 10000 });
    
    console.log('✅ Step 4 draft saved');
    
    console.log('✅ All steps can save as draft');
  });

  test('EPC Ratings Persistence', async ({ page }) => {
    console.log('⚡ Testing EPC ratings persistence...\n');
    
    await login(page);
    await navigateToProperties(page);
    
    // Create and edit a property
    await page.click('text=Add Property');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.selectOption('select[name="for"]', 'sale');
    await page.fill('input[name="propertyName"]', `EPC Test ${Date.now()}`);
    await page.click('button:has-text("Save as Draft")');
    await page.waitForSelector('text=Property created successfully', { timeout: 10000 });
    
    // Edit the draft
    await navigateToProperties(page);
    await page.click('text=Drafts');
    await page.click('button:has-text("Edit Draft")');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Navigate to EPC step
    await page.click('text=Photos/Floor/FPC Plan');
    await page.selectOption('select[name="epcChartOption"]', 'ratings');
    await page.waitForSelector('select[name="currentEERating"]', { timeout: 5000 });
    
    // Set EPC ratings
    await page.selectOption('select[name="currentEERating"]', '65');
    await page.selectOption('select[name="potentialEERating"]', '75');
    
    // Navigate away and back
    await page.click('text=Attachments');
    await page.waitForTimeout(1000);
    await page.click('text=Photos/Floor/FPC Plan');
    
    // Verify values persisted
    const currentRating = await page.inputValue('select[name="currentEERating"]');
    const potentialRating = await page.inputValue('select[name="potentialEERating"]');
    
    expect(currentRating).toBe('65');
    expect(potentialRating).toBe('75');
    
    console.log('✅ EPC ratings persisted correctly');
  });

  test('Error Handling', async ({ page }) => {
    console.log('🚨 Testing error handling...\n');
    
    await login(page);
    await navigateToProperties(page);
    
    // Try to create property with invalid data
    await page.click('text=Add Property');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Leave required fields empty and try to publish
    await page.selectOption('select[name="for"]', 'sale');
    await page.click('button:has-text("Publish Property")');
    
    // Should show validation errors
    await expect(page.locator('text=This field is required')).toBeVisible();
    
    console.log('✅ Validation errors shown correctly');
    
    // Test save as draft with minimal data (should work)
    await page.fill('input[name="propertyName"]', `Error Test ${Date.now()}`);
    await page.click('button:has-text("Save as Draft")');
    await page.waitForSelector('text=Property created successfully', { timeout: 10000 });
    
    console.log('✅ Draft saved with minimal data');
  });
});

// ============================================================================
// Test Configuration
// ============================================================================

test.describe.configure({ 
  mode: 'serial',
  retries: 1,
  timeout: 120000 // 2 minutes per test
});
