#!/usr/bin/env bash
echo "🚀 [Codespaces Boot] Starting Anamnesis Services..."

WORKSPACE_DIR="$(pwd)"

# Kill any existing processes
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*src/index.js" 2>/dev/null || true

# Start backend
cd "$WORKSPACE_DIR/backend"
nohup npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started on port 3010 (PID: $BACKEND_PID)"

sleep 3

# Start frontend
cd "$WORKSPACE_DIR/frontend"
nohup node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started on port 5173 (PID: $FRONTEND_PID)"

# Set port 5173 to public if gh CLI is available
if command -v gh &> /dev/null && [ -n "$CODESPACE_NAME" ]; then
  sleep 4
  gh codespace ports visibility 5173:public -c "$CODESPACE_NAME" 2>/dev/null || true
  echo "🌐 Port 5173 visibility set to public"
fi

echo "=================================================="
echo "🎉 Anamnesis Medical System is READY!"
echo "📱 Default PIN: 123456"
echo "=================================================="
