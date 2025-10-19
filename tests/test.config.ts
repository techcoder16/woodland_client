/**
 * Test Configuration
 * Copy this file and adjust values for your environment
 */

export const TEST_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5002/api',
  
  // Test User Credentials (create this user in your database first)
  TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || 'admin@woodland.com',
  TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || '12345',
  
  // Test Settings
  TEST_TIMEOUT: 30000, // 30 seconds
  TEST_CLEANUP: true, // Clean up test data after tests
  
  // Debug
  VERBOSE: process.env.VERBOSE === 'true',
};

