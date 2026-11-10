#!/usr/bin/env bash
set -e

echo "🏥 [Codespaces Setup] Initializing Anamnesis Medical System..."

# 1. Setup backend .env if missing
if [ ! -f backend/.env ]; then
  cat << 'EOF' > backend/.env
APP_PIN=123456
NODE_ENV=development
PORT=3010
CORS_ORIGINS=*
BACKUP_ENABLED=false
EOF
  echo "✅ backend/.env configured with default PIN 123456"
fi

# 2. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# 3. Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🎉 [Codespaces Setup] Installation complete!"
