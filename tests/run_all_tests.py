#!/usr/bin/env python3
"""
Comprehensive Test Runner
========================

This script runs all available test suites for the property management system:
- Complete property lifecycle tests
- Enhanced property tests with detailed logging
- Draft property management tests
- Finance exclusion tests

Usage:
    python tests/run_all_tests.py                    # Run all test suites
    python tests/run_all_tests.py --suite complete  # Run specific suite
    python tests/run_all_tests.py --headless        # Run in headless mode
    python tests/run_all_tests.py --parallel        # Run tests in parallel
"""

import asyncio
import argparse
import sys
import json
import time
from datetime import datetime
from pathlib import Path

# Import test suites
from property_complete_test import PropertyTestSuite
from enhanced_property_test import EnhancedPropertyTestSuite
from draft_property_test import DraftPropertyTestSuite
from connection_checker import ConnectionChecker

class ComprehensiveTestRunner:
    def __init__(self):
        self.test_suites = {
            'complete': PropertyTestSuite,
            'enhanced': EnhancedPropertyTestSuite,
            'draft': DraftPropertyTestSuite
        }
        self.results = {}
        self.start_time = None

    async def run_test_suite(self, suite_name: str, suite_class, headless: bool = False):
        """Run a specific test suite"""
        print(f"\n🧪 Running {suite_name} test suite...")
        print("-" * 50)
        
        start_time = datetime.now()
        
        try:
            suite = suite_class()
            
            # Configure for headless mode if requested
            if headless and hasattr(suite, 'headless'):
                suite.headless = True
            
            # Run the appropriate test method
            if suite_name == 'complete':
                await suite.run_complete_test_suite()
            elif suite_name == 'enhanced':
                await suite.run_complete_test_suite()
            elif suite_name == 'draft':
                await suite.run_complete_draft_test_suite()
            
            duration = (datetime.now() - start_time).total_seconds()
            return {
                'success': True,
                'duration': duration,
                'message': f'{suite_name} test suite completed successfully'
            }
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            return {
                'success': False,
                'duration': duration,
                'error': str(e),
                'message': f'{suite_name} test suite failed'
            }

    async def check_connections(self):
        """Check if application is running before tests"""
        print("🔍 Checking application connections...")
        checker = ConnectionChecker()
        
        success = await checker.run_checks()
        if not success:
            print("\n❌ Application is not running!")
            print("Please start the application first:")
            print("1. Start backend: npm start (should run on http://localhost:5002)")
            print("2. Start frontend: npm run dev (should run on http://localhost:8081)")
            print("3. Then run the tests again")
            return False
        
        print("✅ Application is running and ready for tests!")
        return True

    async def run_all_suites(self, headless: bool = False, parallel: bool = False):
        """Run all test suites"""
        print("🚀 Running all test suites...")
        print("=" * 60)
        
        # Check connections first
        if not await self.check_connections():
            return
        
        self.start_time = datetime.now()
        
        if parallel:
            # Run all suites in parallel
            tasks = []
            for suite_name, suite_class in self.test_suites.items():
                task = self.run_test_suite(suite_name, suite_class, headless)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, (suite_name, _) in enumerate(self.test_suites.items()):
                if isinstance(results[i], Exception):
                    self.results[suite_name] = {
                        'success': False,
                        'duration': 0,
                        'error': str(results[i]),
                        'message': f'{suite_name} test suite failed with exception'
                    }
                else:
                    self.results[suite_name] = results[i]
        else:
            # Run suites sequentially
            for suite_name, suite_class in self.test_suites.items():
                result = await self.run_test_suite(suite_name, suite_class, headless)
                self.results[suite_name] = result
        
        # Save results
        await self.save_results()
        
        # Print summary
        self.print_summary()

    async def run_specific_suite(self, suite_name: str, headless: bool = False):
        """Run a specific test suite"""
        if suite_name not in self.test_suites:
            print(f"❌ Unknown test suite: {suite_name}")
            print(f"Available suites: {', '.join(self.test_suites.keys())}")
            return
        
        print(f"🧪 Running {suite_name} test suite...")
        print("=" * 60)
        
        # Check connections first
        if not await self.check_connections():
            return
        
        self.start_time = datetime.now()
        
        suite_class = self.test_suites[suite_name]
        result = await self.run_test_suite(suite_name, suite_class, headless)
        self.results[suite_name] = result
        
        # Save results
        await self.save_results()
        
        # Print summary
        self.print_summary()

    async def save_results(self):
        """Save test results to file"""
        total_duration = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
        
        results = {
            'test_runner': 'Comprehensive Test Runner',
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': datetime.now().isoformat(),
            'total_duration': total_duration,
            'suites': self.results
        }
        
        with open('comprehensive_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📊 Test results saved to comprehensive_test_results.json")

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_suites = len(self.results)
        passed_suites = sum(1 for r in self.results.values() if r['success'])
        failed_suites = total_suites - passed_suites
        
        for suite_name, result in self.results.items():
            status = "✅ PASSED" if result['success'] else "❌ FAILED"
            duration = result['duration']
            print(f"{suite_name:<15} {status:<10} ({duration:.2f}s)")
            
            if not result['success'] and 'error' in result:
                print(f"  └─ Error: {result['error']}")
        
        print("-" * 60)
        print(f"Total Suites: {total_suites}")
        print(f"Passed: {passed_suites}")
        print(f"Failed: {failed_suites}")
        print(f"Success Rate: {(passed_suites/total_suites)*100:.1f}%")
        
        total_duration = sum(r['duration'] for r in self.results.values())
        print(f"Total Duration: {total_duration:.2f}s")
        print("=" * 60)

    def print_available_suites(self):
        """Print available test suites"""
        print("\n📋 Available Test Suites:")
        print("=" * 40)
        
        suites_info = {
            'complete': {
                'name': 'Complete Property Test Suite',
                'description': 'Tests complete property lifecycle including add, edit, delete, and publish',
                'features': ['Login', 'Add Property', 'Edit Property', 'Delete Property', 'Publish Property']
            },
            'enhanced': {
                'name': 'Enhanced Property Test Suite',
                'description': 'Enhanced test suite with detailed logging, error handling, and screenshots',
                'features': ['Detailed Logging', 'Error Handling', 'Screenshots', 'Request/Response Logging']
            },
            'draft': {
                'name': 'Draft Property Test Suite',
                'description': 'Tests draft property functionality and finance exclusion',
                'features': ['Create Draft', 'Edit Draft', 'Publish Draft', 'Finance Exclusion', 'Status Filtering']
            }
        }
        
        for suite_id, info in suites_info.items():
            print(f"\n🔧 {info['name']} ({suite_id})")
            print(f"   Description: {info['description']}")
            print(f"   Features: {', '.join(info['features'])}")
        
        print("\n💡 Usage Examples:")
        print("   python tests/run_all_tests.py --suite complete")
        print("   python tests/run_all_tests.py --suite enhanced --headless")
        print("   python tests/run_all_tests.py --suite draft --parallel")
        print("   python tests/run_all_tests.py --headless --parallel")

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Comprehensive Property Management Test Runner')
    parser.add_argument('--suite', '-s', help='Run specific test suite', 
                       choices=['complete', 'enhanced', 'draft'])
    parser.add_argument('--headless', action='store_true', 
                       help='Run in headless mode')
    parser.add_argument('--parallel', action='store_true', 
                       help='Run test suites in parallel')
    parser.add_argument('--list', '-l', action='store_true', 
                       help='List available test suites')
    
    args = parser.parse_args()
    
    print("🏠 COMPREHENSIVE PROPERTY MANAGEMENT TEST RUNNER")
    print("=" * 60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Base URL: http://localhost:8081")
    print(f"👤 Login: admin@woodland.com")
    print("=" * 60)
    
    runner = ComprehensiveTestRunner()
    
    if args.list:
        runner.print_available_suites()
        return
    
    if args.suite:
        # Run specific suite
        await runner.run_specific_suite(args.suite, args.headless)
    else:
        # Run all suites
        await runner.run_all_suites(args.headless, args.parallel)
    
    # Exit with appropriate code
    failed_suites = sum(1 for r in runner.results.values() if not r['success'])
    if failed_suites > 0:
        print(f"\n💥 {failed_suites} test suite(s) failed!")
        sys.exit(1)
    else:
        print("\n🎉 All test suites completed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
