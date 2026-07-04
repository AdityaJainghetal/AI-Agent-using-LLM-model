@echo off
REM AI Service Troubleshooting Guide for Windows

echo.
echo =^=^= EduForge AI Service Troubleshooter ^=^=^=
echo.

REM Check Node.js
echo 1. Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.   [OK] Node.js installed: 
    node --version
) else (
    echo.   [FAIL] Node.js not found. Install from nodejs.org
    exit /b 1
)

echo.
echo 2. Checking MongoDB...
netstat -an | findstr "27017" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.   [OK] MongoDB is running on localhost:27017
) else (
    echo.   [WARN] MongoDB not found on localhost:27017
    echo.   Make sure MongoDB is running
)

echo.
echo 3. Checking Ollama...
netstat -an | findstr "11434" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.   [OK] Ollama is running on localhost:11434
    
    REM Check for llama2 model
    curl -s http://localhost:11434/api/tags | findstr "llama2" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo.   [OK] llama2 model found
    ) else (
        echo.   [WARN] llama2 model not found
        echo.   Download it with: ollama pull llama2
    )
) else (
    echo.   [FAIL] Ollama not running on localhost:11434
    echo.   Start Ollama with: ollama serve
)

echo.
echo 4. Checking .env file...
if exist "Server\.env" (
    echo.   [OK] .env file found
    findstr /I "AI_PROVIDER" Server\.env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo.   [OK] AI_PROVIDER is set
    ) else (
        echo.   [FAIL] AI_PROVIDER not set in .env
    )
) else (
    echo.   [FAIL] .env file not found
)

echo.
echo 5. Testing Backend API...
curl -s -X POST http://localhost:5000/api/ai/public/chat ^
    -H "Content-Type: application/json" ^
    -d "{\"message\": \"Hello\", \"mode\": \"tutor\"}" | findstr "reply" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.   [OK] API is responding
) else (
    echo.   [FAIL] API is not responding or erroring
    echo.   Check backend logs: npm run dev
)

echo.
echo =^=^= Troubleshooting Complete ^=^=^=
echo.
echo Common Issues ^& Solutions:
echo.
echo [FAIL] 'Ollama is not running'
echo    ^-^> Run: ollama serve
echo.
echo [FAIL] 'llama2 model not found'
echo    ^-^> Run: ollama pull llama2
echo.
echo [FAIL] 'Cannot connect to MongoDB'
echo    ^-^> Start MongoDB service
echo.
echo [FAIL] 'AI provider not configured'
echo    ^-^> Check Server\.env has AI_PROVIDER=ollama
echo.
pause
