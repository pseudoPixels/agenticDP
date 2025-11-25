#!/bin/bash

# AI Lesson Generator - Deployment Script

set -e

echo "🚀 AI Lesson Generator - Deployment Script"
echo "==========================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env file..."
    echo "GEMINI_API_KEY=your_api_key_here" > .env
    echo "Please edit .env and add your Gemini API key"
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo ""
echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🔄 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check backend health
echo "🔍 Checking backend health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
echo "🔍 Checking frontend health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy!"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo "✨ Deployment successful!"
echo ""
echo "🌐 Your application is now running:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:5000"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "🎉 Happy lesson generating!"
