#!/bin/bash

# Setup script for creating .env file

echo "🔧 Setting up environment variables..."

if [ -f "backend/.env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy the example file
cp backend/.env.example backend/.env

echo "✅ Created backend/.env file"
echo ""
echo "📝 Next steps:"
echo "1. Get your Gemini API key from: https://aistudio.google.com/app/apikey"
echo "2. Edit backend/.env and add your API key"
echo "3. Run: backend/venv/bin/python backend/app.py"
echo ""
echo "💡 Tip: The .env file is gitignored and won't be committed to git"
