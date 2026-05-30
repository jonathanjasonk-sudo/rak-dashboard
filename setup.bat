@echo off
REM RAK Dashboard - Setup Script for Windows
REM Double-click to run

echo =====================================
echo   RAK Dashboard - Setup Script
echo =====================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js not found!
    echo Please download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%A in ('node --version') do set NODE_VERSION=%%A
for /f "tokens=*" %%A in ('npm --version') do set NPM_VERSION=%%A

echo   Node version: %NODE_VERSION%
echo   npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed
    echo.
    pause
    exit /b 1
)
echo.

REM Create .env if not exists
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo   Created .env - Update with your DATABASE_URL
    echo.
)

REM Summary
echo =====================================
echo   Setup Complete!
echo =====================================
echo.
echo Next steps:
echo.
echo 1. Update .env with your database URL:
echo    DATABASE_URL=postgresql://user:pass@localhost:5432/rak_dashboard
echo.
echo 2. Start server:
echo    npm start
echo.
echo 3. Open browser:
echo    http://localhost:3000
echo.
echo For Railway deployment, see RAILWAY_DEPLOYMENT.md
echo.
pause
