#!/usr/bin/env python3
"""
Test Environment Setup Script
==============================

This script sets up the test environment for the property management test suite.
It installs dependencies, sets up directories, and verifies the setup.

Run: python tests/setup_tests.py
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor} is compatible")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    
    # Check if requirements.txt exists
    requirements_file = Path("tests/requirements.txt")
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    # Install requirements
    if not run_command("pip install -r tests/requirements.txt", "Installing requirements"):
        return False
    
    return True

def install_playwright():
    """Install Playwright browsers"""
    print("🎭 Installing Playwright browsers...")
    
    # Install Playwright
    if not run_command("pip install playwright", "Installing Playwright"):
        return False
    
    # Install browsers
    if not run_command("playwright install chromium", "Installing Chromium browser"):
        return False
    
    return True

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    directories = [
        "screenshots",
        "test_results",
        "logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True

def verify_setup():
    """Verify the test setup"""
    print("🔍 Verifying setup...")
    
    # Check if Playwright is installed
    try:
        import playwright
        print("✅ Playwright is installed")
    except ImportError:
        print("❌ Playwright is not installed")
        return False
    
    # Check if test files exist
    test_files = [
        "tests/property_complete_test.py",
        "tests/enhanced_property_test.py",
        "tests/run_property_tests.py",
        "tests/test_selectors.py"
    ]
    
    for file in test_files:
        if Path(file).exists():
            print(f"✅ Found: {file}")
        else:
            print(f"❌ Missing: {file}")
            return False
    
    return True

def print_usage_instructions():
    """Print usage instructions"""
    print("\n" + "="*60)
    print("🎉 TEST ENVIRONMENT SETUP COMPLETE!")
    print("="*60)
    print("\n📋 Available Commands:")
    print("  python tests/property_complete_test.py          # Run main test suite")
    print("  python tests/enhanced_property_test.py         # Run enhanced test suite")
    print("  python tests/run_property_tests.py             # Run with options")
    print("  python tests/run_property_tests.py --list       # List available tests")
    print("  python tests/run_property_tests.py --test add_property  # Run specific test")
    print("  python tests/run_property_tests.py --headless  # Run in headless mode")
    print("  python tests/run_property_tests.py --slow      # Run with slow motion")
    
    print("\n🔧 Configuration:")
    print("  Edit tests/test_selectors.py to modify test settings")
    print("  Screenshots will be saved in screenshots/ directory")
    print("  Test results will be saved in test_results.json")
    
    print("\n🌐 Prerequisites:")
    print("  - Application running on http://localhost:8081")
    print("  - Backend API running on http://localhost:5002")
    print("  - Login credentials: admin@woodland.com / 12345")
    
    print("\n📚 Documentation:")
    print("  See tests/README.md for detailed documentation")
    print("="*60)

def main():
    """Main setup function"""
    print("🚀 Setting up Property Management Test Environment...")
    print("="*60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Install Playwright
    if not install_playwright():
        print("❌ Failed to install Playwright")
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        print("❌ Failed to create directories")
        sys.exit(1)
    
    # Verify setup
    if not verify_setup():
        print("❌ Setup verification failed")
        sys.exit(1)
    
    # Print usage instructions
    print_usage_instructions()

if __name__ == "__main__":
    main()
