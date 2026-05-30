#!/bin/bash

# RAK Dashboard - Quick Setup Script
# Jalankan: bash setup.sh

echo "====================================="
echo "  RAK Dashboard - Setup Script"
echo "====================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install from https://nodejs.org"
    exit 1
fi
echo "  Node version: $(node --version)"
echo "  npm version: $(npm --version)"
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ npm install failed"
    exit 1
fi
echo ""

# Create .env if not exists
if [ ! -f .env ]; then
    echo "✓ Creating .env file..."
    cp .env.example .env
    echo "  Created .env - Update with your DATABASE_URL"
    echo ""
fi

# Summary
echo "====================================="
echo "  Setup Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Update .env with your database URL:"
echo "   DATABASE_URL=postgresql://user:pass@localhost:5432/rak_dashboard"
echo ""
echo "2. Start server:"
echo "   npm start"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "For Railway deployment, see RAILWAY_DEPLOYMENT.md"
echo ""
