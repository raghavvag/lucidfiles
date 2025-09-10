#!/bin/bash

# Semantic File Explorer - Development Setup Script

echo "🚀 Setting up Semantic File Explorer..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start Qdrant database
echo "📊 Starting Qdrant database..."
docker-compose up -d

# Wait for Qdrant to be ready
echo "⏳ Waiting for Qdrant to be ready..."
sleep 10

# Check Qdrant health
if curl -f http://localhost:6333/health > /dev/null 2>&1; then
    echo "✅ Qdrant is running on http://localhost:6333"
else
    echo "❌ Qdrant failed to start"
    exit 1
fi

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "✅ Backend dependencies installed"

# Setup worker
echo ""
echo "🐍 Setting up Python worker..."
cd ../worker
if [ ! -d "venv" ]; then
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
echo "✅ Worker dependencies installed"

# Setup frontend
echo ""
echo "⚛️ Setting up frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "✅ Frontend dependencies installed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend:  cd backend && npm run dev"
echo "2. Worker:   cd worker && source venv/bin/activate && python api_server.py"
echo "3. Frontend: cd frontend && npm run electron-dev"
echo ""
echo "Or use the start scripts in each directory."
echo ""
echo "Access points:"
echo "- Qdrant Dashboard: http://localhost:6333/dashboard"
echo "- Backend API: http://localhost:3001"
echo "- Worker API: http://localhost:8000"
echo "- Electron App: Will open automatically"
