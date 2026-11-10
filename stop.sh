#!/data/data/com.termux/files/usr/bin/bash
echo "🛑 Stopping Anamnesis..."
if [ -f /tmp/anamnesis_pids.txt ]; then
  kill $(cat /tmp/anamnesis_pids.txt) 2>/dev/null
  rm /tmp/anamnesis_pids.txt
fi
pkill -f "vite" 2>/dev/null
pkill -f "nodemon\|node.*index.js" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
echo "✅ All servers stopped. Phone will cool down."
