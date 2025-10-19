#!/usr/bin/env python3
"""
Application Startup Helper
=========================

This script helps start the application and run tests.
It can check if the application is running and provide instructions.

Usage:
    python tests/start_application.py --check
    python tests/start_application.py --start
    python tests/start_application.py --run-tests
"""

import asyncio
import subprocess
import sys
import time
import argparse
from pathlib import Path
from connection_checker import ConnectionChecker

class ApplicationStarter:
    def __init__(self):
        self.checker = ConnectionChecker()
        self.frontend_dir = None
        self.backend_dir = None

    def find_application_directories(self):
        """Find frontend and backend directories"""
        print("🔍 Looking for application directories...")
        
        # Look for common frontend directories
        frontend_candidates = [
            ".",
            "frontend",
            "client",
            "web",
            "src"
        ]
        
        # Look for common backend directories
        backend_candidates = [
            "backend",
            "server",
            "api",
            ".."
        ]
        
        # Check for package.json (frontend)
        for candidate in frontend_candidates:
            if Path(candidate, "package.json").exists():
                self.frontend_dir = Path(candidate)
                print(f"✅ Found frontend directory: {self.frontend_dir}")
                break
        
        # Check for backend indicators
        for candidate in backend_candidates:
            if (Path(candidate, "package.json").exists() or 
                Path(candidate, "requirements.txt").exists() or
                Path(candidate, "main.py").exists()):
                self.backend_dir = Path(candidate)
                print(f"✅ Found backend directory: {self.backend_dir}")
                break
        
        if not self.frontend_dir:
            print("⚠️ Frontend directory not found")
        if not self.backend_dir:
            print("⚠️ Backend directory not found")

    async def check_application_status(self):
        """Check if application is running"""
        print("🔍 Checking application status...")
        return await self.checker.run_checks()

    async def start_frontend(self):
        """Start frontend application"""
        if not self.frontend_dir:
            print("❌ Frontend directory not found")
            return False
        
        print(f"🚀 Starting frontend from {self.frontend_dir}...")
        
        try:
            # Check if node_modules exists
            if not Path(self.frontend_dir, "node_modules").exists():
                print("📦 Installing frontend dependencies...")
                subprocess.run(["npm", "install"], cwd=self.frontend_dir, check=True)
            
            # Start frontend
            print("🌐 Starting frontend server...")
            subprocess.Popen(["npm", "run", "dev"], cwd=self.frontend_dir)
            
            # Wait for frontend to be ready
            print("⏳ Waiting for frontend to be ready...")
            for i in range(30):  # Wait up to 30 seconds
                if await self.checker.check_frontend():
                    print("✅ Frontend is ready!")
                    return True
                await asyncio.sleep(1)
            
            print("❌ Frontend did not start within timeout")
            return False
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to start frontend: {e}")
            return False
        except FileNotFoundError:
            print("❌ npm not found. Please install Node.js")
            return False

    async def start_backend(self):
        """Start backend application"""
        if not self.backend_dir:
            print("❌ Backend directory not found")
            return False
        
        print(f"🚀 Starting backend from {self.backend_dir}...")
        
        try:
            # Check if it's a Node.js backend
            if Path(self.backend_dir, "package.json").exists():
                print("📦 Installing backend dependencies...")
                subprocess.run(["npm", "install"], cwd=self.backend_dir, check=True)
                print("🔧 Starting backend server...")
                subprocess.Popen(["npm", "start"], cwd=self.backend_dir)
            
            # Check if it's a Python backend
            elif Path(self.backend_dir, "requirements.txt").exists():
                print("📦 Installing Python dependencies...")
                subprocess.run(["pip", "install", "-r", "requirements.txt"], cwd=self.backend_dir, check=True)
                print("🐍 Starting Python backend...")
                subprocess.Popen(["python", "main.py"], cwd=self.backend_dir)
            
            # Wait for backend to be ready
            print("⏳ Waiting for backend to be ready...")
            for i in range(30):  # Wait up to 30 seconds
                if await self.checker.check_backend():
                    print("✅ Backend is ready!")
                    return True
                await asyncio.sleep(1)
            
            print("❌ Backend did not start within timeout")
            return False
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to start backend: {e}")
            return False
        except FileNotFoundError:
            print("❌ Required tools not found. Please install Node.js or Python")
            return False

    async def start_application(self):
        """Start the complete application"""
        print("🚀 Starting application...")
        print("=" * 50)
        
        # Find directories
        self.find_application_directories()
        
        # Check if already running
        if await self.check_application_status():
            print("✅ Application is already running!")
            return True
        
        # Start backend
        if not await self.start_backend():
            print("❌ Failed to start backend")
            return False
        
        # Start frontend
        if not await self.start_frontend():
            print("❌ Failed to start frontend")
            return False
        
        # Final check
        if await self.check_application_status():
            print("🎉 Application is running and ready!")
            return True
        else:
            print("❌ Application failed to start properly")
            return False

    async def run_tests(self):
        """Run the test suite"""
        print("🧪 Running tests...")
        
        # Check if application is running
        if not await self.check_application_status():
            print("❌ Application is not running. Please start it first.")
            return False
        
        # Run tests
        try:
            result = subprocess.run([sys.executable, "tests/run_all_tests.py"], check=True)
            print("✅ Tests completed successfully!")
            return True
        except subprocess.CalledProcessError:
            print("❌ Tests failed")
            return False

    def print_instructions(self):
        """Print setup instructions"""
        print("\n" + "=" * 60)
        print("🚀 APPLICATION SETUP INSTRUCTIONS")
        print("=" * 60)
        print("\n📋 To run the tests, you need to start the application:")
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
        
        print("\n🔧 Alternative: Use this script to auto-start:")
        print("   python tests/start_application.py --start")
        print("   python tests/start_application.py --run-tests")
        print("=" * 60)

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Application Startup Helper')
    parser.add_argument('--check', action='store_true', 
                       help='Check if application is running')
    parser.add_argument('--start', action='store_true', 
                       help='Start the application')
    parser.add_argument('--run-tests', action='store_true', 
                       help='Run tests (check application first)')
    parser.add_argument('--instructions', action='store_true', 
                       help='Show setup instructions')
    
    args = parser.parse_args()
    
    starter = ApplicationStarter()
    
    if args.instructions:
        starter.print_instructions()
        return
    
    if args.check:
        if await starter.check_application_status():
            print("✅ Application is running!")
            sys.exit(0)
        else:
            print("❌ Application is not running!")
            sys.exit(1)
    
    if args.start:
        if await starter.start_application():
            print("🎉 Application started successfully!")
            sys.exit(0)
        else:
            print("💥 Failed to start application!")
            sys.exit(1)
    
    if args.run_tests:
        if await starter.run_tests():
            print("🎉 Tests completed successfully!")
            sys.exit(0)
        else:
            print("💥 Tests failed!")
            sys.exit(1)
    
    # Default: show instructions
    starter.print_instructions()

if __name__ == "__main__":
    asyncio.run(main())
