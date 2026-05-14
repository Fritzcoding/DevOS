#!/bin/bash

echo ""
echo "===================================="
echo "DevOps Lite - Desktop App Launcher"
echo "===================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "WARNING: .env.local not found!"
    echo ""
    echo "Please create .env.local with your Gemini API key:"
    echo "GEMINI_API_KEY=your_api_key_here"
    echo ""
    echo "Get your free API key from: https://ai.google.dev/"
    echo ""
    echo "Creating template..."
    
    cat > ".env.local" <<EOF
# Gemini API Key - Get one from https://ai.google.dev/
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: App URL for development
APP_URL=http://localhost:5173
EOF
    
    echo ""
    echo "Template created at .env.local"
    echo "Please edit it with your Gemini API key before running again."
    echo ""
    sleep 5
    exit 0
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
    echo "1. Node.js is installed (node --version)"
    echo "2. .env.local has valid GEMINI_API_KEY"
    echo "3. Port 5173 is not in use"
    echo ""
fi
