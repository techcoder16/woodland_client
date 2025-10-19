/**
 * Property Management Integration Tests
 * 
 * These tests actually create, edit, draft, publish, and delete properties
 * Run: npm test
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@woodland.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345';

let authToken: string;
let api: AxiosInstance;
let createdPropertyIds: string[] = [];

// ============================================================================
// Setup & Teardown
// ============================================================================

async function setup() {
  console.log('🔧 Setting up tests...\n');
  
  // Create axios instance
  api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Login to get auth token
  try {
    console.log(`🔐 Attempting login with ${TEST_USER_EMAIL}...`);
    
    const response = await api.post('/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    
    console.log('Login response:', JSON.stringify(response.data, null, 2));
    
    authToken = response.data.access_token || response.data.token || response.data.accessToken;
    
    if (!authToken) {
      throw new Error('No auth token received from login');
    }

    // Set auth header for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('✅ Authentication successful\n');
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    console.error('Full error:', error);
    throw error;
  }
}

async function teardown() {
  console.log('\n🧹 Cleaning up test data...\n');
  
  // Delete all created properties
  for (const id of createdPropertyIds) {
    try {
      await api.delete(`/properties/${id}`);
      console.log(`✅ Deleted property: ${id}`);
    } catch (error: any) {
      console.log(`⚠️  Could not delete property ${id}:`, error.message);
    }
  }
  
  console.log('\n✅ Cleanup complete');
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateTestProperty(status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') {
  const timestamp = Date.now();
  return {
    propertyStatus: status,
    for: 'sale',
    category: 'residential',
    propertyType: 'Flat',
    propertyName: `Test Property ${timestamp}`,
    postCode: 'SW1A 1AA',
    town: 'London',
    country: 'UK',
    price: '250000-GBP',
    tenure: 'Freehold',
    propertyFeature: [],
    selectPortals: [],
    rooms: [],
  };
}

function assertProperty(property: any, expected: any, testName: string) {
  if (!property) {
    throw new Error(`${testName}: Property is null or undefined`);
  }
  
  for (const key in expected) {
    if (property[key] !== expected[key]) {
      throw new Error(
        `${testName}: Expected ${key} to be "${expected[key]}" but got "${property[key]}"`
      );
    }
  }
}

// ============================================================================
// Test Suite 1: Create Property
// ============================================================================

async function testCreatePropertyDraft() {
  console.log('📝 Test: Create Property as Draft');
  
  try {
    const propertyData = generateTestProperty('DRAFT');
    
    const response = await api.post('/properties', propertyData);
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Expected 200/201 but got ${response.status}`);
    }
    
    const property = response.data.property || response.data;
    createdPropertyIds.push(property.id);
    
    // Verify response
    assertProperty(property, {
      propertyStatus: 'DRAFT',
      for: 'sale',
      propertyName: propertyData.propertyName,
    }, 'Create Draft');
    
    console.log('✅ PASS: Property created as DRAFT');
    console.log(`   Property ID: ${property.id}\n`);
    
    return property.id;
  } catch (error: any) {
    console.error('❌ FAIL: Create Property as Draft');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreatePropertyPublished() {
  console.log('📝 Test: Create Property as Published');
  
  try {
    const propertyData = {
      ...generateTestProperty('PUBLISHED'),
      // Add required fields for published property
      addressLine1: '123 Test Street',
      latitude: '51.5074',
      longitude: '-0.1278',
      shortSummary: 'A beautiful test property',
      fullDescription: 'This is a comprehensive description of the test property.',
    };
    
    const response = await api.post('/properties', propertyData);
    
    const property = response.data.property || response.data;
    createdPropertyIds.push(property.id);
    
    assertProperty(property, {
      propertyStatus: 'PUBLISHED',
      propertyName: propertyData.propertyName,
    }, 'Create Published');
    
    console.log('✅ PASS: Property created as PUBLISHED');
    console.log(`   Property ID: ${property.id}\n`);
    
    return property.id;
  } catch (error: any) {
    console.error('❌ FAIL: Create Property as Published');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// Test Suite 2: Read Properties
// ============================================================================

async function testGetAllProperties() {
  console.log('📝 Test: Get All Properties');
  
  try {
    const response = await api.get('/properties');
    
    if (!response.data.items && !Array.isArray(response.data)) {
      throw new Error('Response should contain items array or be an array');
    }
    
    const properties = response.data.items || response.data;
    
    console.log('✅ PASS: Retrieved all properties');
    console.log(`   Total properties: ${properties.length}\n`);
    
    return properties;
  } catch (error: any) {
    console.error('❌ FAIL: Get All Properties');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetDrafts() {
  console.log('📝 Test: Get Draft Properties Only');
  
  try {
    const response = await api.get('/properties', {
      params: { propertyStatus: 'DRAFT' }
    });
    
    const properties = response.data.items || response.data;
    
    // Verify all returned properties are drafts
    for (const property of properties) {
      if (property.propertyStatus !== 'DRAFT') {
        throw new Error(`Expected only DRAFT properties but found ${property.propertyStatus}`);
      }
    }
    
    console.log('✅ PASS: Retrieved draft properties only');
    console.log(`   Total drafts: ${properties.length}\n`);
    
    return properties;
  } catch (error: any) {
    console.error('❌ FAIL: Get Draft Properties');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetPublished() {
  console.log('📝 Test: Get Published Properties Only');
  
  try {
    const response = await api.get('/properties', {
      params: { propertyStatus: 'PUBLISHED' }
    });
    
    const properties = response.data.items || response.data;
    
    // Verify all returned properties are published
    for (const property of properties) {
      if (property.propertyStatus !== 'PUBLISHED') {
        throw new Error(`Expected only PUBLISHED properties but found ${property.propertyStatus}`);
      }
    }
    
    console.log('✅ PASS: Retrieved published properties only');
    console.log(`   Total published: ${properties.length}\n`);
    
    return properties;
  } catch (error: any) {
    console.error('❌ FAIL: Get Published Properties');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// Test Suite 3: Update Property
// ============================================================================

async function testUpdateDraft(propertyId: string) {
  console.log('📝 Test: Update Draft Property');
  
  try {
    const updates = {
      propertyStatus: 'DRAFT',
      propertyName: `Updated Test Property ${Date.now()}`,
      price: '300000-GBP',
      rooms: JSON.stringify([
        { name: 'Living Room', width: '5', length: '4', description: 'Spacious' }
      ]),
      propertyFeature: ['Garden', 'Parking'],
    };
    
    const response = await api.patch(`/properties/${propertyId}`, updates);
    
    const property = response.data.property || response.data;
    
    assertProperty(property, {
      propertyStatus: 'DRAFT',
      propertyName: updates.propertyName,
    }, 'Update Draft');
    
    console.log('✅ PASS: Draft property updated successfully');
    console.log(`   New name: ${property.propertyName}\n`);
    
    return property;
  } catch (error: any) {
    console.error('❌ FAIL: Update Draft Property');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testUpdateWithArrayFields(propertyId: string) {
  console.log('📝 Test: Update Property with Array Fields');
  
  try {
    const updates = {
      propertyStatus: 'DRAFT',
      propertyFeature: ['Balcony', 'Garden', 'Garage'],
      selectPortals: ['Rightmove', 'Zoopla'],
      rooms: JSON.stringify([
        { name: 'Bedroom 1', width: '4', length: '3', description: 'Master' },
        { name: 'Bedroom 2', width: '3', length: '3', description: 'Guest' },
      ]),
    };
    
    const response = await api.patch(`/properties/${propertyId}`, updates);
    
    const property = response.data.property || response.data;
    
    // Verify arrays are handled correctly
    const propertyFeature = Array.isArray(property.propertyFeature) 
      ? property.propertyFeature 
      : JSON.parse(property.propertyFeature || '[]');
      
    if (propertyFeature.length !== 3) {
      throw new Error(`Expected 3 property features but got ${propertyFeature.length}`);
    }
    
    console.log('✅ PASS: Array fields updated correctly');
    console.log(`   Features: ${propertyFeature.join(', ')}\n`);
    
    return property;
  } catch (error: any) {
    console.error('❌ FAIL: Update Property with Array Fields');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// Test Suite 4: Publish Draft
// ============================================================================

async function testPublishDraft(propertyId: string) {
  console.log('📝 Test: Publish Draft Property');
  
  try {
    // First, ensure all required fields are filled
    const updates = {
      propertyStatus: 'DRAFT',
      addressLine1: '456 Test Avenue',
      latitude: '51.5074',
      longitude: '-0.1278',
      shortSummary: 'A wonderful property',
      fullDescription: 'This property has everything you need.',
    };
    
    await api.patch(`/properties/${propertyId}`, updates);
    
    // Now publish it
    const response = await api.patch(`/properties/${propertyId}/publish`);
    
    const property = response.data.property || response.data;
    
    if (property.propertyStatus !== 'PUBLISHED') {
      throw new Error(`Expected PUBLISHED but got ${property.propertyStatus}`);
    }
    
    console.log('✅ PASS: Draft published successfully');
    console.log(`   Status: ${property.propertyStatus}\n`);
    
    return property;
  } catch (error: any) {
    console.error('❌ FAIL: Publish Draft Property');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testPublishedStaysPublished(propertyId: string) {
  console.log('📝 Test: Published Property Stays Published on Update');
  
  try {
    const updates = {
      propertyName: `Updated Published Property ${Date.now()}`,
      price: '350000-GBP',
    };
    
    const response = await api.patch(`/properties/${propertyId}`, updates);
    
    const property = response.data.property || response.data;
    
    if (property.propertyStatus !== 'PUBLISHED') {
      throw new Error(`Property should remain PUBLISHED but is ${property.propertyStatus}`);
    }
    
    console.log('✅ PASS: Published property remained published after update');
    console.log(`   Status: ${property.propertyStatus}\n`);
    
    return property;
  } catch (error: any) {
    console.error('❌ FAIL: Published Property Status Check');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// Test Suite 5: Delete Property
// ============================================================================

async function testDeleteProperty(propertyId: string) {
  console.log('📝 Test: Delete Property');
  
  try {
    const response = await api.delete(`/properties/${propertyId}`);
    
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Expected 200/204 but got ${response.status}`);
    }
    
    // Verify property is deleted by trying to fetch it
    try {
      await api.get(`/properties/${propertyId}`);
      throw new Error('Property should not exist after deletion');
    } catch (error: any) {
      if (error.response?.status === 404) {
        // This is expected
        console.log('✅ PASS: Property deleted successfully');
        console.log(`   Property ID: ${propertyId}\n`);
        
        // Remove from cleanup list
        createdPropertyIds = createdPropertyIds.filter(id => id !== propertyId);
        return true;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('❌ FAIL: Delete Property');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// Test Suite 6: Edge Cases
// ============================================================================

async function testCreateDraftWithMinimalData() {
  console.log('📝 Test: Create Draft with Minimal Data');
  
  try {
    const minimalData = {
      propertyStatus: 'DRAFT',
      for: 'let',
      // Only required field
    };
    
    const response = await api.post('/properties', minimalData);
    
    const property = response.data.property || response.data;
    createdPropertyIds.push(property.id);
    
    if (property.propertyStatus !== 'DRAFT') {
      throw new Error(`Expected DRAFT but got ${property.propertyStatus}`);
    }
    
    console.log('✅ PASS: Minimal draft created successfully');
    console.log(`   Property ID: ${property.id}\n`);
    
    return property.id;
  } catch (error: any) {
    console.error('❌ FAIL: Create Draft with Minimal Data');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testEPCRatings(propertyId: string) {
  console.log('📝 Test: Update EPC Ratings');
  
  try {
    const updates = {
      propertyStatus: 'DRAFT',
      epcChartOption: 'ratings',
      currentEERating: '75',
      potentialEERating: '85',
    };
    
    const response = await api.patch(`/properties/${propertyId}`, updates);
    
    const property = response.data.property || response.data;
    
    // EPC ratings might be returned as strings or numbers
    const currentRating = String(property.currentEERating);
    const potentialRating = String(property.potentialEERating);
    
    if (currentRating !== '75') {
      throw new Error(`Expected currentEERating to be 75 but got ${currentRating}`);
    }
    
    if (potentialRating !== '85') {
      throw new Error(`Expected potentialEERating to be 85 but got ${potentialRating}`);
    }
    
    console.log('✅ PASS: EPC ratings updated correctly');
    console.log(`   Current: ${currentRating}, Potential: ${potentialRating}\n`);
    
    return property;
  } catch (error: any) {
    console.error('❌ FAIL: Update EPC Ratings');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testEmptyArrayFields(propertyId: string) {
  console.log('📝 Test: Empty Array Fields');
  
  try {
    const updates = {
      propertyStatus: 'DRAFT',
      propertyFeature: [],
      selectPortals: [],
    };
    
    const response = await api.patch(`/properties/${propertyId}`, updates);
    
    const property = response.data.property || response.data;
    
    console.log('✅ PASS: Empty arrays handled correctly\n');
    
    return property;
  } catch (error: any) {
    console.error('❌ FAIL: Empty Array Fields');
    console.error('   Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('🚀 Starting Property Integration Tests\n');
  console.log('='.repeat(80) + '\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    failures: [] as string[],
  };

  try {
    await setup();
    
    // Test Suite 1: Create
    console.log('📦 TEST SUITE 1: CREATE PROPERTY\n');
    const draftId = await testCreatePropertyDraft();
    results.passed++; results.total++;
    
    const publishedId = await testCreatePropertyPublished();
    results.passed++; results.total++;
    
    // Test Suite 2: Read
    console.log('📖 TEST SUITE 2: READ PROPERTIES\n');
    await testGetAllProperties();
    results.passed++; results.total++;
    
    await testGetDrafts();
    results.passed++; results.total++;
    
    await testGetPublished();
    results.passed++; results.total++;
    
    // Test Suite 3: Update
    console.log('✏️  TEST SUITE 3: UPDATE PROPERTY\n');
    await testUpdateDraft(draftId);
    results.passed++; results.total++;
    
    await testUpdateWithArrayFields(draftId);
    results.passed++; results.total++;
    
    // Test Suite 4: Publish
    console.log('🚀 TEST SUITE 4: PUBLISH DRAFT\n');
    await testPublishDraft(draftId);
    results.passed++; results.total++;
    
    await testPublishedStaysPublished(publishedId);
    results.passed++; results.total++;
    
    // Test Suite 5: Delete
    console.log('🗑️  TEST SUITE 5: DELETE PROPERTY\n');
    await testDeleteProperty(draftId);
    results.passed++; results.total++;
    
    // Test Suite 6: Edge Cases
    console.log('🔬 TEST SUITE 6: EDGE CASES\n');
    const minimalId = await testCreateDraftWithMinimalData();
    results.passed++; results.total++;
    
    await testEPCRatings(minimalId);
    results.passed++; results.total++;
    
    await testEmptyArrayFields(minimalId);
    results.passed++; results.total++;
    
  } catch (error: any) {
    results.failed++;
    results.total++;
    results.failures.push(error.message);
  } finally {
    await teardown();
  }
  
  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`\nPass Rate: ${passRate}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failures.forEach(failure => {
      console.log(`   - ${failure}`);
    });
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});

