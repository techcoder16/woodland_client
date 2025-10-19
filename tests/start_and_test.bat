@echo off
echo ========================================
echo Property Management Test Suite
echo ========================================
echo.

echo Checking if application is running...
python tests/connection_checker.py --check
if %errorlevel% neq 0 (
    echo.
    echo Application is not running. Please start it first:
    echo.
    echo 1. Start backend API:
    echo    cd your-backend-directory
    echo    npm start
    echo    (should run on http://localhost:5002)
    echo.
    echo 2. Start frontend application:
    echo    cd your-frontend-directory
    echo    npm run dev
    echo    (should run on http://localhost:8081)
    echo.
    echo 3. Then run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo Application is running! Starting tests...
echo.

python tests/run_all_tests.py

echo.
echo Tests completed!
pause
