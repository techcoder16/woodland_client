#!/usr/bin/env python3
"""
Connection Checker
==================

This utility checks if the application is running and ready for testing.
It verifies both frontend and backend connections before running tests.

Usage:
    python tests/connection_checker.py
    python tests/connection_checker.py --frontend-only
    python tests/connection_checker.py --backend-only
"""

import asyncio
import aiohttp
import argparse
import sys
import time
from datetime import datetime
from test_selectors import TEST_CONFIG

class ConnectionChecker:
    def __init__(self):
        self.frontend_url = TEST_CONFIG['base_url']
        self.backend_url = 'http://localhost:5002/api'
        self.timeout = TEST_CONFIG.get('connection_timeout', 30)

    async def check_frontend(self):
        """Check if frontend is running"""
        print("🌐 Checking frontend connection...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.frontend_url}/login", timeout=10) as response:
                    if response.status == 200:
                        print("✅ Frontend is running and accessible")
                        return True
                    else:
                        print(f"❌ Frontend returned status {response.status}")
                        return False
        except aiohttp.ClientConnectorError:
            print("❌ Frontend connection refused - application not running")
            return False
        except asyncio.TimeoutError:
            print("❌ Frontend connection timeout")
            return False
        except Exception as e:
            print(f"❌ Frontend check failed: {e}")
            return False

    async def check_backend(self):
        """Check if backend API is running"""
        print("🔧 Checking backend API connection...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Try to access a simple endpoint
                async with session.get(f"{self.backend_url}/health", timeout=10) as response:
                    if response.status == 200:
                        print("✅ Backend API is running and accessible")
                        return True
                    else:
                        print(f"❌ Backend API returned status {response.status}")
                        return False
        except aiohttp.ClientConnectorError:
            print("❌ Backend API connection refused - API not running")
            return False
        except asyncio.TimeoutError:
            print("❌ Backend API connection timeout")
            return False
        except Exception as e:
            print(f"❌ Backend API check failed: {e}")
            return False

    async def check_login_endpoint(self):
        """Check if login endpoint is accessible"""
        print("🔐 Checking login endpoint...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.frontend_url}/login", timeout=10) as response:
                    if response.status == 200:
                        # Check if login form is present
                        content = await response.text()
                        if 'email' in content.lower() and 'password' in content.lower():
                            print("✅ Login endpoint is accessible and has login form")
                            return True
                        else:
                            print("❌ Login endpoint accessible but no login form found")
                            return False
                    else:
                        print(f"❌ Login endpoint returned status {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Login endpoint check failed: {e}")
            return False

    async def wait_for_application(self, max_wait_time=60):
        """Wait for application to be ready"""
        print(f"⏳ Waiting for application to be ready (max {max_wait_time}s)...")
        
        start_time = time.time()
        while time.time() - start_time < max_wait_time:
            if await self.check_frontend():
                print("✅ Application is ready!")
                return True
            
            print("⏳ Application not ready yet, waiting 5 seconds...")
            await asyncio.sleep(5)
        
        print("❌ Application did not become ready within timeout")
        return False

    async def run_checks(self, frontend_only=False, backend_only=False):
        """Run all connection checks"""
        print("🔍 Running connection checks...")
        print("=" * 50)
        
        results = {
            'frontend': False,
            'backend': False,
            'login': False
        }
        
        if not backend_only:
            results['frontend'] = await self.check_frontend()
            if results['frontend']:
                results['login'] = await self.check_login_endpoint()
        
        if not frontend_only:
            results['backend'] = await self.check_backend()
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 CONNECTION CHECK RESULTS")
        print("=" * 50)
        
        for service, status in results.items():
            status_icon = "✅" if status else "❌"
            print(f"{service.capitalize():<15} {status_icon}")
        
        all_required = results['frontend'] and results['login']
        if not backend_only:
            all_required = all_required and results['backend']
        
        if all_required:
            print("\n🎉 All required services are running!")
            return True
        else:
            print("\n💥 Some services are not running!")
            return False

    def print_setup_instructions(self):
        """Print setup instructions"""
        print("\n" + "=" * 60)
        print("🚀 SETUP INSTRUCTIONS")
        print("=" * 60)
        print("\n📋 To run the tests, you need to start the application first:")
        print("\n1. Start the backend API:")
        print("   cd your-backend-directory")
        print("   npm start  # or your backend start command")
        print("   # Should be running on http://localhost:5002")
        
        print("\n2. Start the frontend application:")
        print("   cd your-frontend-directory")
        print("   npm run dev  # or your frontend start command")
        print("   # Should be running on http://localhost:8081")
        
        print("\n3. Verify the application is running:")
        print("   - Open http://localhost:8081 in your browser")
        print("   - You should see the login page")
        print("   - Login with: admin@woodland.com / 12345")
        
        print("\n4. Run the tests:")
        print("   python tests/run_all_tests.py")
        
        print("\n🔧 Alternative: Use the wait option to auto-detect when ready:")
        print("   python tests/connection_checker.py --wait")
        print("=" * 60)

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Connection Checker for Property Management Tests')
    parser.add_argument('--frontend-only', action='store_true', 
                       help='Check only frontend connection')
    parser.add_argument('--backend-only', action='store_true', 
                       help='Check only backend connection')
    parser.add_argument('--wait', action='store_true', 
                       help='Wait for application to be ready')
    parser.add_argument('--setup', action='store_true', 
                       help='Show setup instructions')
    
    args = parser.parse_args()
    
    if args.setup:
        checker = ConnectionChecker()
        checker.print_setup_instructions()
        return
    
    checker = ConnectionChecker()
    
    if args.wait:
        success = await checker.wait_for_application()
        if not success:
            checker.print_setup_instructions()
            sys.exit(1)
    else:
        success = await checker.run_checks(
            frontend_only=args.frontend_only,
            backend_only=args.backend_only
        )
        
        if not success:
            checker.print_setup_instructions()
            sys.exit(1)
    
    print("\n✅ All checks passed! You can now run the tests.")

if __name__ == "__main__":
    asyncio.run(main())
