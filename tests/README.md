# Property Management Test Suite

This comprehensive test suite provides automated testing for the property management system using Python Playwright.

## 🚀 Quick Start

### Prerequisites

1. **Python 3.8+** installed
2. **Playwright** installed
3. **Application running** on `http://localhost:8081`
4. **Backend API** running on `http://localhost:5002`

### ⚠️ Important: Start Application First

**The tests will fail if the application is not running!** 

Before running tests, you must start both the frontend and backend:

```bash
# 1. Start backend API (in one terminal)
cd your-backend-directory
npm start  # Should run on http://localhost:5002

# 2. Start frontend application (in another terminal)
cd your-frontend-directory
npm run dev  # Should run on http://localhost:8081

# 3. Verify application is running
# Open http://localhost:8081 in browser
# Login with: admin@woodland.com / 12345
```

### Installation

```bash
# Install Python dependencies
pip install -r tests/requirements.txt

# Install Playwright browsers
playwright install chromium
```

### Running Tests

```bash
# Check if application is running first
python tests/connection_checker.py --check

# Run all tests (with connection check)
python tests/run_all_tests.py

# Run specific test
python tests/run_property_tests.py --test add_property

# Run in headless mode
python tests/run_property_tests.py --headless

# Run with slow motion for debugging
python tests/run_property_tests.py --slow

# Easy start and test (Windows)
tests/start_and_test.bat

# Easy start and test (Unix/Linux/Mac)
chmod +x tests/start_and_test.sh
./tests/start_and_test.sh
```

## 📁 Test Files

### Core Test Scripts

| File | Description | Usage |
|------|-------------|-------|
| `property_complete_test.py` | Main test suite with complete property lifecycle | `python tests/property_complete_test.py` |
| `enhanced_property_test.py` | Enhanced test suite with detailed logging and error handling | `python tests/enhanced_property_test.py` |
| `run_property_tests.py` | Test runner with command-line options | `python tests/run_property_tests.py` |

### Configuration Files

| File | Description |
|------|-------------|
| `test_selectors.py` | All CSS selectors and element identifiers |
| `requirements.txt` | Python dependencies |
| `README.md` | This documentation |

## 🧪 Test Scenarios

### 1. Complete Property Lifecycle
- ✅ Login to application
- ✅ Navigate to properties page
- ✅ Add complete property (all steps)
- ✅ Edit existing property
- ✅ Create draft property
- ✅ Edit draft property
- ✅ Publish draft property
- ✅ Test property filters
- ✅ Test EPC ratings

### 2. Draft Property Management
- ✅ Create draft property
- ✅ Edit draft property
- ✅ Publish draft property
- ✅ Verify draft properties don't appear in finance

### 3. EPC Rating Testing
- ✅ Set current energy efficiency rating
- ✅ Set potential energy efficiency rating
- ✅ Verify ratings persist correctly
- ✅ Test rating validation

### 4. Form Validation
- ✅ Required field validation
- ✅ Data type validation
- ✅ EPC rating validation
- ✅ Error message display

## 🎯 Available Tests

### Individual Tests

```bash
# Add complete property
python tests/run_property_tests.py --test add_property

# Create draft property
python tests/run_property_tests.py --test create_draft

# Edit existing property
python tests/run_property_tests.py --test edit_property

# Edit draft property
python tests/run_property_tests.py --test edit_draft

# Publish draft property
python tests/run_property_tests.py --test publish_draft

# Test EPC ratings
python tests/run_property_tests.py --test epc_ratings

# Test property filters
python tests/run_property_tests.py --test filters

# Run all tests
python tests/run_property_tests.py --test all
```

### Test Options

```bash
# Run in headless mode (no browser window)
python tests/run_property_tests.py --headless

# Run with slow motion (1000ms delay between actions)
python tests/run_property_tests.py --slow

# List available tests
python tests/run_property_tests.py --list
```

## 🔧 Configuration

### Test Configuration

Edit `test_selectors.py` to modify:

- **Base URL**: `TEST_CONFIG['base_url']`
- **Login credentials**: `TEST_CONFIG['login_email']`, `TEST_CONFIG['login_password']`
- **Browser settings**: `BROWSER_CONFIG`
- **Timeouts**: `WAIT_TIMEOUTS`
- **Test data**: `TEST_DATA_TEMPLATES`

### Browser Configuration

```python
BROWSER_CONFIG = {
    'headless': False,        # Set to True for headless mode
    'slow_mo': 0,            # Delay between actions (ms)
    'viewport': {'width': 1920, 'height': 1080},
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
```

### Wait Timeouts

```python
WAIT_TIMEOUTS = {
    'short': 5000,      # 5 seconds
    'medium': 10000,    # 10 seconds
    'long': 30000,      # 30 seconds
    'very_long': 60000  # 60 seconds
}
```

## 📊 Test Results

### Screenshots
- Screenshots are automatically saved on test failures
- Location: `screenshots/` directory
- Naming: `{test_name}_{timestamp}.png`

### Test Reports
- JSON report: `test_results.json`
- Includes test results, timing, and error details
- Screenshot paths for failed tests

### Logging
- Detailed console output for each test step
- Request/response logging for debugging
- Error messages with context

## 🐛 Debugging

### Common Issues

1. **Login fails**
   - Check if application is running on `http://localhost:8081`
   - Verify login credentials in `test_selectors.py`
   - Check network connectivity

2. **Elements not found**
   - Update selectors in `test_selectors.py`
   - Check if UI has changed
   - Increase wait timeouts

3. **Tests timeout**
   - Increase timeout values in `WAIT_TIMEOUTS`
   - Check application performance
   - Verify network connectivity

### Debug Mode

```bash
# Run with slow motion for debugging
python tests/run_property_tests.py --slow

# Run specific test for focused debugging
python tests/run_property_tests.py --test add_property --slow
```

### Screenshots

Screenshots are automatically taken on:
- Test failures
- Element not found errors
- Click/fill failures

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Property Management Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install -r tests/requirements.txt
      - run: playwright install chromium
      - run: python tests/run_property_tests.py --headless
```

### Docker Example

```dockerfile
FROM python:3.9-slim
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable
COPY . /app
WORKDIR /app
RUN pip install -r tests/requirements.txt
RUN playwright install chromium
CMD ["python", "tests/run_property_tests.py", "--headless"]
```

## 📝 Writing New Tests

### Basic Test Structure

```python
async def test_new_functionality(self):
    """Test new functionality"""
    test_name = "Test New Functionality"
    start_time = datetime.now()
    
    try:
        print("🧪 Testing new functionality...")
        
        # Test steps here
        await self.safe_click('button:has-text("New Button")')
        await self.safe_fill('input[name="newField"]', 'test value')
        
        duration = (datetime.now() - start_time).total_seconds()
        self.test_results.append({
            'test': test_name,
            'success': True,
            'duration': duration,
            'message': 'Test completed successfully'
        })
        print("✅ Test completed successfully")
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        self.test_results.append({
            'test': test_name,
            'success': False,
            'duration': duration,
            'error': str(e)
        })
        print(f"❌ Test failed: {e}")
        await self.take_screenshot("test_failed")
        raise
```

### Adding New Selectors

1. Add to `test_selectors.py`:
```python
NEW_SELECTORS = {
    'new_button': 'button:has-text("New Button")',
    'new_input': 'input[name="newField"]'
}
```

2. Use in tests:
```python
await self.safe_click(NEW_SELECTORS['new_button'])
await self.safe_fill(NEW_SELECTORS['new_input'], 'test value')
```

## 🤝 Contributing

1. **Add new tests** to the appropriate test file
2. **Update selectors** in `test_selectors.py` if UI changes
3. **Add new test data** to `TEST_DATA_TEMPLATES`
4. **Update documentation** in this README
5. **Test your changes** before submitting

## 📞 Support

For issues or questions:
1. Check the test logs and screenshots
2. Verify application is running correctly
3. Check selectors in `test_selectors.py`
4. Review this documentation

---

**Happy Testing! 🎉**
