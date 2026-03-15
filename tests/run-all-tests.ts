/**
 * Complete Test Runner
 * 
 * This script runs all types of tests:
 * 1. Code quality tests
 * 2. End-to-end browser tests
 * 3. Integration API tests
 * 
 * Run: npm run test:all
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  output: string;
  errors: string[];
}

const results: TestResult[] = [];

async function runTest(name: string, command: string, timeout = 60000): Promise<TestResult> {
  console.log(`\n🧪 Running ${name}...`);
  console.log(`Command: ${command}\n`);
  
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(command, { 
      timeout,
      cwd: process.cwd()
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${name} PASSED (${duration}ms)`);
    
    return {
      name,
      status: 'PASS',
      duration,
      output: stdout,
      errors: stderr ? [stderr] : []
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.log(`❌ ${name} FAILED (${duration}ms)`);
    console.log(`Error: ${error.message}`);
    
    return {
      name,
      status: 'FAIL',
      duration,
      output: error.stdout || '',
      errors: [error.message]
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Complete Test Suite');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  
  try {
    // Test 1: Code Quality Tests
    console.log('\n📊 PHASE 1: Code Quality Tests');
    console.log('-'.repeat(50));
    
    const qaResult = await runTest(
      'Code Quality Check',
      'npm run test:qa'
    );
    results.push(qaResult);
    
    // Test 2: End-to-End Browser Tests
    console.log('\n🌐 PHASE 2: End-to-End Browser Tests');
    console.log('-'.repeat(50));
    console.log('Note: This will start the dev server automatically');
    
    const e2eResult = await runTest(
      'End-to-End Tests',
      'npm run test:e2e',
      180000 // 3 minutes for e2e tests
    );
    results.push(e2eResult);
    
    // Test 3: Integration API Tests (if backend is available)
    console.log('\n🔗 PHASE 3: Integration API Tests');
    console.log('-'.repeat(50));
    console.log('Note: Requires backend API running on port 5002');
    
    const integrationResult = await runTest(
      'API Integration Tests',
      'npm test',
      120000 // 2 minutes for integration tests
    );
    results.push(integrationResult);
    
  } catch (error) {
    console.error('💥 Test runner crashed:', error);
  }
  
  // Generate Report
  const totalDuration = Date.now() - startTime;
  generateReport(totalDuration);
}

function generateReport(totalDuration: number) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE TEST SUITE REPORT');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
  
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
  console.log(`\nPass Rate: ${passRate}%`);
  
  // Detailed Results
  console.log('\n📋 DETAILED RESULTS:');
  console.log('-'.repeat(50));
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const duration = Math.round(result.duration / 1000);
    
    console.log(`${icon} ${result.name} (${duration}s)`);
    
    if (result.status === 'FAIL' && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);B 
    }
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('-'.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your property management system is ready for production.');
  } else {
    console.log('🔧 Some tests failed. Here\'s what to check:');
    
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`\n❌ ${result.name}:`);
      
      if (result.name.includes('Code Quality')) {
        console.log('   - Run: npm run test:qa');
        console.log('   - Fix any code quality issues shown');
      }
      
      if (result.name.includes('End-to-End')) {
        console.log('   - Check if dev server is running on localhost:8081');
        console.log('   - Verify login credentials in test file');
        console.log('   - Check browser console for errors');
      }
      
      if (result.name.includes('Integration')) {
        console.log('   - Start your backend API on port 5002');
        console.log('   - Verify API endpoints are working');
        console.log('   - Check database connection');
      }
    });
  }
  
  // Next Steps
  console.log('\n🚀 NEXT STEPS:');
  console.log('-'.repeat(50));
  
  if (failed === 0) {
    console.log('1. ✅ Remove debug console.log statements');
    console.log('2. ✅ Deploy to production');
    console.log('3. ✅ Monitor for any issues');
  } else {
    console.log('1. 🔧 Fix failing tests (see recommendations above)');
    console.log('2. 🔄 Re-run tests: npm run test:all');
    console.log('3. ✅ Once all pass, deploy to production');
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
