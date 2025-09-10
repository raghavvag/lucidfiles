@echo off
echo 🚀 Setting up Semantic File Explorer...
echo.

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

:: Start Qdrant database
echo 📊 Starting Qdrant database...
docker-compose up -d

:: Wait for Qdrant to be ready
echo ⏳ Waiting for Qdrant to be ready...
timeout /t 10 /nobreak >nul

:: Check Qdrant health
curl -f http://localhost:6333/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Qdrant failed to start
    pause
    exit /b 1
) else (
    echo ✅ Qdrant is running on http://localhost:6333
)

:: Setup backend
echo.
echo 🔧 Setting up backend...
cd backend
if not exist "node_modules" (
    npm install
)
echo ✅ Backend dependencies installed

:: Setup worker
echo.
echo 🐍 Setting up Python worker...
cd ..\worker
if not exist "venv" (
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)
echo ✅ Worker dependencies installed

:: Setup frontend
echo.
echo ⚛️ Setting up frontend...
cd ..\frontend
if not exist "node_modules" (
    npm install
)
echo ✅ Frontend dependencies installed

echo.
echo 🎉 Setup complete!
echo.
echo To start the application:
echo 1. Backend:  cd backend ^&^& npm run dev
echo 2. Worker:   cd worker ^&^& venv\Scripts\activate ^&^& python api_server.py
echo 3. Frontend: cd frontend ^&^& npm run electron-dev
echo.
echo Or use the start scripts in each directory.
echo.
echo Access points:
echo - Qdrant Dashboard: http://localhost:6333/dashboard
echo - Backend API: http://localhost:3001
echo - Worker API: http://localhost:8000
echo - Electron App: Will open automatically
echo.
pause
