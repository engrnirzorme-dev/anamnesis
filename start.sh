#!/data/data/com.termux/files/usr/bin/bash
# Quick start script for Anamnesis Medical System
echo "🏥 Starting Anamnesis Medical System..."

# Start backend in background
cd ~/anamnesis/backend && npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

sleep 3

# Start frontend in background
cd ~/anamnesis/frontend && node node_modules/vite/bin/vite.js --host 0.0.0.0 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

sleep 2

# Start cloudflared tunnel and get URL
cloudflared tunnel --url http://localhost:5173 > /tmp/cloudflared.log 2>&1 &
CF_PID=$!
echo "⏳ Cloudflare tunnel starting..."
sleep 5

URL=$(grep -o 'https://[a-z0-9\-]*\.trycloudflare\.com' /tmp/cloudflared.log | head -1)
echo ""
echo "======================================"
echo "🌐 LIVE URL: $URL"
echo "📱 PIN: 123456"
echo "======================================"
echo "To STOP everything: bash ~/anamnesis/stop.sh"
echo ""
echo "$BACKEND_PID $FRONTEND_PID $CF_PID" > /tmp/anamnesis_pids.txt
