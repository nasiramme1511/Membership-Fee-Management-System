#!/usr/bin/env bash
# build.sh - Production build script for Render.com
# Runs from the repository root directory

set -e

echo "=========================================="
echo "🔨 MFC PP-DD Branch Production Build Starting..."
echo "=========================================="

# Step 1: Install & Build Frontend
echo ""
echo "📦 Step 1: Installing frontend dependencies..."
cd frontend
npm ci --prefer-offline || npm install

echo "🎨 Step 1b: Generating PWA icons..."
node scripts/generate-icons.cjs 2>/dev/null || echo "⚠️ Icon generation skipped (will use fallback)"

echo "⚡ Step 2: Building React frontend (Vite)..."
npm run build

echo "🔄 Step 2b: Copying PWA files to dist..."
cp -r public/icons dist/icons/ 2>/dev/null || mkdir -p dist/icons
cp public/manifest.json dist/manifest.json 2>/dev/null || true
cp public/service-worker.js dist/service-worker.js 2>/dev/null || true
echo "✅ PWA files copied to dist."

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
