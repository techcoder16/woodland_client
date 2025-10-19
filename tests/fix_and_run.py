#!/usr/bin/env python3
"""
Fix and Run Tests
================

This script helps fix common issues and run the tests.
It checks for common problems and provides solutions.

Usage:
    python tests/fix_and_run.py
    python tests/fix_and_run.py --check-only
    python tests/fix_and_run.py --install-deps
"""

import asyncio
import subprocess
import sys
import os
from pathlib import Path

class TestFixer:
    def __init__(self):
        self.issues_found = []
        self.fixes_applied = []

    def check_python_version(self):
        """Check Python version"""
        print("🐍 Checking Python version...")
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 8):
            self.issues_found.append(f"Python 3.8+ required, found {version.major}.{version.minor}")
            return False
        print(f"✅ Python {version.major}.{version.minor} is compatible")
        return True

    def check_dependencies(self):
        """Check if dependencies are installed"""
        print("📦 Checking dependencies...")
        
        try:
            import playwright
            print("✅ Playwright is installed")
        except ImportError:
            self.issues_found.append("Playwright is not installed")
            return False
        
        try:
            import aiohttp
            print("✅ aiohttp is installed")
        except ImportError:
            self.issues_found.append("aiohttp is not installed")
            return False
        
        return True

    def install_dependencies(self):
        """Install missing dependencies"""
        print("📦 Installing dependencies...")
        
        try:
            # Install Python dependencies
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "tests/requirements.txt"], check=True)
            print("✅ Python dependencies installed")
            
            # Install Playwright browsers
            subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
            print("✅ Playwright browsers installed")
            
            self.fixes_applied.append("Dependencies installed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.issues_found.append(f"Failed to install dependencies: {e}")
            return False

    async def check_application(self):
        """Check if application is running"""
        print("🌐 Checking application...")
        
        try:
            from connection_checker import ConnectionChecker
            checker = ConnectionChecker()
            
            if await checker.run_checks():
                print("✅ Application is running")
                return True
            else:
                self.issues_found.append("Application is not running")
                return False
                
        except Exception as e:
            self.issues_found.append(f"Failed to check application: {e}")
            return False

    def create_directories(self):
        """Create necessary directories"""
        print("📁 Creating directories...")
        
        directories = ["screenshots", "test_results", "logs"]
        
        for directory in directories:
            Path(directory).mkdir(exist_ok=True)
            print(f"✅ Created directory: {directory}")
        
        self.fixes_applied.append("Directories created")
        return True

    def print_application_instructions(self):
        """Print instructions for starting application"""
        print("\n" + "=" * 60)
        print("🚀 APPLICATION SETUP REQUIRED")
        print("=" * 60)
        print("\nThe tests require the application to be running.")
        print("Please start both the frontend and backend:")
        print("\n1. Start backend API:")
        print("   cd your-backend-directory")
        print("   npm start  # Should run on http://localhost:5002")
        print("\n2. Start frontend application:")
        print("   cd your-frontend-directory")
        print("   npm run dev  # Should run on http://localhost:8081")
        print("\n3. Verify application is running:")
        print("   - Open http://localhost:8081 in your browser")
        print("   - You should see the login page")
        print("   - Login with: admin@woodland.com / 12345")
        print("\n4. Then run the tests:")
        print("   python tests/run_all_tests.py")
        print("=" * 60)

    async def run_tests(self):
        """Run the test suite"""
        print("🧪 Running tests...")
        
        try:
            result = subprocess.run([sys.executable, "tests/run_all_tests.py"], check=True)
            print("✅ Tests completed successfully!")
            return True
        except subprocess.CalledProcessError:
            print("❌ Tests failed")
            return False

    async def fix_and_run(self, check_only=False, install_deps=False):
        """Fix issues and run tests"""
        print("🔧 Fixing and running tests...")
        print("=" * 50)
        
        # Check Python version
        if not self.check_python_version():
            print("❌ Python version issue cannot be fixed automatically")
            return False
        
        # Check dependencies
        if not self.check_dependencies():
            if install_deps:
                if not self.install_dependencies():
                    print("❌ Failed to install dependencies")
                    return False
            else:
                print("❌ Dependencies missing. Run with --install-deps to fix")
                return False
        
        # Create directories
        self.create_directories()
        
        # Check application
        if not await self.check_application():
            self.print_application_instructions()
            return False
        
        if check_only:
            print("✅ All checks passed!")
            return True
        
        # Run tests
        return await self.run_tests()

    def print_summary(self):
        """Print summary of issues and fixes"""
        if self.issues_found:
            print("\n❌ Issues found:")
            for issue in self.issues_found:
                print(f"  - {issue}")
        
        if self.fixes_applied:
            print("\n✅ Fixes applied:")
            for fix in self.fixes_applied:
                print(f"  - {fix}")
        
        if not self.issues_found and not self.fixes_applied:
            print("\n✅ No issues found!")

async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix and Run Property Management Tests')
    parser.add_argument('--check-only', action='store_true', 
                       help='Only check for issues, do not run tests')
    parser.add_argument('--install-deps', action='store_true', 
                       help='Install missing dependencies')
    
    args = parser.parse_args()
    
    fixer = TestFixer()
    
    success = await fixer.fix_and_run(
        check_only=args.check_only,
        install_deps=args.install_deps
    )
    
    fixer.print_summary()
    
    if success:
        print("\n🎉 Ready to run tests!")
        sys.exit(0)
    else:
        print("\n💥 Issues need to be resolved first")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
