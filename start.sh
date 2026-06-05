#!/bin/bash

echo ""
echo "===================================="
echo "DevOps Lite - Desktop App Launcher"
echo "===================================="
echo ""

if ! npm run preflight; then
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies and compiling Electron entrypoints..."
    npm run setup
    if [ $? -ne 0 ]; then
        echo "Failed to set up DevOps Lite"
        exit 1
    fi
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo ".env.local not found. This is OK if you configure AI in the app or use local Ollama."
    echo "To use env-file cloud setup, copy .env.example to .env.local and add GEMINI_API_KEY."
fi

echo "Starting DevOps Lite..."
echo ""
echo "The app will launch in a moment."
echo ""
echo "- **Vite Dev Server**: http://localhost:5173"
echo "- **Electron App**: Watch taskbar/system tray for icon"
echo "- **Activity Log**: Check sidebar for real-time logs"
echo ""
echo "Press Ctrl+C to stop."
echo ""

npm run dev

if [ $? -ne 0 ]; then
    echo ""
    echo "Error running the app. Check:"
    echo "1. Node.js 20.19+ is installed (node --version)"
    echo "2. Dependencies were installed with npm run setup"
    echo "3. Port 5173 is available, or Vite selected another port shown above"
    echo ""
fi
