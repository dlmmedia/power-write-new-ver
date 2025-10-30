#!/bin/bash

# PowerWrite AI System Setup Script
# This script helps you set up the AI generation system

set -e

echo "🚀 PowerWrite AI System Setup"
echo "=============================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✓ .env.local file found"
else
    echo "❌ .env.local not found"
    echo "Creating .env.local from template..."
    touch .env.local
    cat > .env.local << 'EOF'
# Database
DATABASE_URL=your_neon_database_url_here

# OpenAI API (for text generation and TTS)
OPENAI_API_KEY=sk-your-openai-key-here

# Google AI API (for Imagen cover generation)
GOOGLE_AI_API_KEY=your-google-ai-key-here

# Google Books API (optional - for book search)
GOOGLE_BOOKS_API_KEY=your-google-books-api-key-here

# Vercel AI Gateway (recommended for production)
# Leave empty to use direct API calls
AI_GATEWAY_URL=

# Node Environment
NODE_ENV=development
EOF
    echo "✓ Created .env.local template"
fi

echo ""
echo "📋 Environment Variables Status:"
echo "--------------------------------"

# Check each required variable
check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2-)
    
    if [ -z "$var_value" ] || [ "$var_value" = "your_${var_name,,}_here" ] || [[ "$var_value" == *"your-"* ]]; then
        echo "❌ ${var_name} - NOT SET"
        return 1
    else
        echo "✓ ${var_name} - Configured"
        return 0
    fi
}

all_set=true

if ! check_var "DATABASE_URL"; then all_set=false; fi
if ! check_var "OPENAI_API_KEY"; then all_set=false; fi
if ! check_var "GOOGLE_AI_API_KEY"; then all_set=false; fi

echo ""
if [ "$all_set" = false ]; then
    echo "⚠️  Some required variables are not set!"
    echo ""
    echo "Please edit .env.local and add your API keys:"
    echo ""
    echo "  1. OPENAI_API_KEY from https://platform.openai.com/api-keys"
    echo "  2. GOOGLE_AI_API_KEY from https://aistudio.google.com/app/apikey"
    echo "  3. DATABASE_URL from your Neon dashboard"
    echo ""
    echo "Then run this script again or start the dev server:"
    echo "  npm run dev --webpack"
    exit 1
fi

echo "✅ All required environment variables are set!"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Start development server:"
echo "     npm run dev --webpack"
echo ""
echo "  2. Open http://localhost:3000/studio"
echo ""
echo "  3. Test book generation:"
echo "     - Fill in book details"
echo "     - Click 'Generate Outline'"
echo "     - Click 'Generate Book'"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: QUICKSTART_AI.md"
echo "  - Full Setup: AI_GATEWAY_SETUP.md"
echo "  - Summary: AI_SYSTEM_SUMMARY.md"
echo ""
echo "Happy writing! 📖✨"
