#!/usr/bin/env python3
"""
Property Test Runner
===================

This script provides an easy way to run different property management tests.

Usage:
    python tests/run_property_tests.py                    # Run all tests
    python tests/run_property_tests.py --test add_property    # Run specific test
    python tests/run_property_tests.py --test create_draft    # Run draft test
    python tests/run_property_tests.py --headless            # Run in headless mode
    python tests/run_property_tests.py --slow                # Run with slow motion
"""

import asyncio
import argparse
import sys
import os
from datetime import datetime
from property_complete_test import PropertyTestSuite

def print_banner():
    """Print test suite banner"""
    print("=" * 60)
    print("🏠 PROPERTY MANAGEMENT TEST SUITE")
    print("=" * 60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Base URL: http://localhost:8081")
    print(f"👤 Login: admin@woodland.com")
    print("=" * 60)

def print_available_tests():
    """Print available test options"""
    print("\n📋 Available Tests:")
    print("  • add_property     - Add complete property with all steps")
    print("  • create_draft     - Create draft property")
    print("  • edit_property    - Edit existing property")
    print("  • edit_draft       - Edit draft property")
    print("  • publish_draft    - Publish draft property")
    print("  • epc_ratings      - Test EPC rating functionality")
    print("  • filters          - Test property filtering")
    print("  • all              - Run complete test suite")

def print_test_results(results):
    """Print test results summary"""
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result['success'] else "❌ FAILED"
        duration = result['duration']
        print(f"{test_name:<20} {status:<10} ({duration:.2f}s)")
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r['success'])
    failed_tests = total_tests - passed_tests
    
    print("-" * 60)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    print("=" * 60)

async def run_single_test(test_name: str, headless: bool = False, slow_mo: int = 0):
    """Run a single test"""
    print(f"\n🧪 Running test: {test_name}")
    print("-" * 40)
    
    start_time = datetime.now()
    
    try:
        test_suite = PropertyTestSuite()
        
        # Configure browser options
        if headless:
            test_suite.headless = True
        if slow_mo > 0:
            test_suite.slow_mo = slow_mo
        
        await test_suite.run_specific_test(test_name)
        
        duration = (datetime.now() - start_time).total_seconds()
        return {'success': True, 'duration': duration}
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        print(f"❌ Test failed: {e}")
        return {'success': False, 'duration': duration, 'error': str(e)}

async def run_all_tests(headless: bool = False, slow_mo: int = 0):
    """Run all tests"""
    print(f"\n🧪 Running complete test suite")
    print("-" * 40)
    
    start_time = datetime.now()
    
    try:
        test_suite = PropertyTestSuite()
        
        # Configure browser options
        if headless:
            test_suite.headless = True
        if slow_mo > 0:
            test_suite.slow_mo = slow_mo
        
        await test_suite.run_complete_test_suite()
        
        duration = (datetime.now() - start_time).total_seconds()
        return {'success': True, 'duration': duration}
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        print(f"❌ Test suite failed: {e}")
        return {'success': False, 'duration': duration, 'error': str(e)}

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Property Management Test Runner')
    parser.add_argument('--test', '-t', help='Run specific test', 
                       choices=['add_property', 'create_draft', 'edit_property', 
                               'edit_draft', 'publish_draft', 'epc_ratings', 
                               'filters', 'all'])
    parser.add_argument('--headless', action='store_true', 
                       help='Run in headless mode')
    parser.add_argument('--slow', action='store_true', 
                       help='Run with slow motion (1000ms delay)')
    parser.add_argument('--list', '-l', action='store_true', 
                       help='List available tests')
    
    args = parser.parse_args()
    
    print_banner()
    
    if args.list:
        print_available_tests()
        return
    
    # Determine test configuration
    headless = args.headless
    slow_mo = 1000 if args.slow else 0
    
    if args.test == 'all' or args.test is None:
        # Run all tests
        result = await run_all_tests(headless, slow_mo)
        print_test_results({'Complete Test Suite': result})
    else:
        # Run specific test
        result = await run_single_test(args.test, headless, slow_mo)
        print_test_results({args.test: result})
    
    # Exit with appropriate code
    if result['success']:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
