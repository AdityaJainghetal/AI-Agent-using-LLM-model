#!/bin/bash
# AI Service Troubleshooting Guide

echo "=== EduForge AI Service Troubleshooter ==="
echo ""

# Check Node.js
echo "1. Checking Node.js installation..."
if command -v node &> /dev/null; then
    echo "   ✅ Node.js installed: $(node -v)"
else
    echo "   ❌ Node.js not found. Install from nodejs.org"
    exit 1
fi

echo ""
echo "2. Checking MongoDB..."
if nc -z 127.0.0.1 27017 2>/dev/null; then
    echo "   ✅ MongoDB is running on localhost:27017"
else
    echo "   ⚠️  MongoDB not found on localhost:27017"
    echo "   Make sure MongoDB is running: mongod"
fi

echo ""
echo "3. Checking Ollama..."
if nc -z 127.0.0.1 11434 2>/dev/null; then
    echo "   ✅ Ollama is running on localhost:11434"
    
    # Check for llama2 model
    if curl -s http://localhost:11434/api/tags | grep -q "llama2"; then
        echo "   ✅ llama2 model found"
    else
        echo "   ⚠️  llama2 model not found"
        echo "   Download it with: ollama pull llama2"
    fi
else
    echo "   ❌ Ollama not running on localhost:11434"
    echo "   Start Ollama with: ollama serve"
fi

echo ""
echo "4. Checking .env file..."
if [ -f "Server/.env" ]; then
    echo "   ✅ .env file found"
    
    # Check for required variables
    if grep -q "AI_PROVIDER" Server/.env; then
        AI_PROVIDER=$(grep AI_PROVIDER Server/.env | cut -d'=' -f2)
        echo "   ✅ AI_PROVIDER: $AI_PROVIDER"
    else
        echo "   ❌ AI_PROVIDER not set in .env"
    fi
else
    echo "   ❌ .env file not found"
fi

echo ""
echo "5. Testing Backend API..."
if curl -s -X POST http://localhost:5000/api/ai/public/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello", "mode": "tutor"}' | grep -q "reply"; then
    echo "   ✅ API is responding"
else
    echo "   ❌ API is not responding or erroring"
    echo "   Check backend logs: npm run dev"
fi

echo ""
echo "=== Troubleshooting Complete ==="
echo ""
echo "Common Issues & Solutions:"
echo ""
echo "❌ 'Ollama is not running'"
echo "   👉 Run: ollama serve"
echo ""
echo "❌ 'llama2 model not found'"
echo "   👉 Run: ollama pull llama2"
echo ""
echo "❌ 'Cannot connect to MongoDB'"
echo "   👉 Start MongoDB: mongod"
echo ""
echo "❌ 'AI provider not configured'"
echo "   👉 Check Server/.env has AI_PROVIDER=ollama"
echo ""
