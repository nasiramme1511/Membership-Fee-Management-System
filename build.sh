#!/usr/bin/env bash
# build.sh - Production build script for Render.com
# Runs from the repository root directory

set -e  # Exit immediately on any error

echo "=========================================="
echo "🔨 MCMS Production Build Starting..."
echo "=========================================="

# Step 1: Install & Build Frontend
echo ""
echo "📦 Step 1: Installing frontend dependencies..."
cd frontend
npm ci --prefer-offline || npm install
echo "⚡ Step 2: Building React frontend (Vite)..."
npm run build
echo "✅ Frontend build complete. Output: frontend/dist/"
cd ..

# Step 2: Install Backend Dependencies
echo ""
echo "📦 Step 3: Installing backend dependencies..."
cd backend
npm ci --prefer-offline || npm install
echo "✅ Backend dependencies installed."
cd ..

echo ""
echo "=========================================="
echo "✅ Build Complete! Ready to start server."
echo "=========================================="
