@echo off
echo.
echo ====================================
echo DevOps Lite - Desktop App Launcher
echo ====================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        exit /b 1
    )
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo.
    echo WARNING: .env.local not found!
    echo.
    echo Please create .env.local with your Gemini API key:
    echo GEMINI_API_KEY=your_api_key_here
    echo.
    echo Get your free API key from: https://ai.google.dev/
    echo.
    echo Creating template...
    (
        echo # Gemini API Key - Get one from https://ai.google.dev/
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo.
        echo # Optional: App URL for development
        echo APP_URL=http://localhost:5173
    ) > ".env.local"
    
    echo.
    echo Template created at .env.local
    echo Please edit it with your Gemini API key before running again.
    echo.
    timeout /t 5
    exit /b 0
)

echo Starting DevOps Lite...
echo.
echo The app will launch in a moment.
echo.
echo - **Vite Dev Server**: http://localhost:5173
echo - **Electron App**: Watch taskbar/system tray for icon
echo - **Activity Log**: Check sidebar for real-time logs
echo.
echo Press Ctrl+C to stop.
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo Error running the app. Check:
    echo 1. Node.js is installed (node --version^)
    echo 2. .env.local has valid GEMINI_API_KEY
    echo 3. Port 5173 is not in use
    echo.
    pause
)
