#!/bin/bash
set -euo pipefail

# Kill any leftover processes on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

PORT=${PORT:-3000}
echo "Starting TriageFlow dev server on port $PORT..."
npm run dev -- -p "$PORT" &
DEV_PID=$!

# Wait for the dev server to be ready
echo "Waiting for dev server..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$PORT" >/dev/null 2>&1; then
    echo "Dev server ready on port $PORT"
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "ERROR: Dev server died"
    exit 1
  fi
  sleep 1
done

echo "Starting ngrok tunnel to port $PORT..."
ngrok http "$PORT" --log=stdout 2>&1 &

NGROK_PID=$!

# Wait for ngrok to establish tunnel
sleep 3

# Fetch the public URL
NGROK_URL=$(curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; tunnels=json.load(sys.stdin).get('tunnels',[]); print(tunnels[0]['public_url'] if tunnels else 'NO TUNNEL')" 2>/dev/null || echo "Could not determine URL")

echo ""
echo "========================================="
echo "  PUBLIC URL: $NGROK_URL"
echo "========================================="
echo ""
echo "Configure your webhooks:"
echo "  Slack:   $NGROK_URL/api/webhooks/slack"
echo "  GitHub:  $NGROK_URL/api/webhooks/github"
echo "  Jira:    $NGROK_URL/api/webhooks/jira"
echo "  Gmail:   $NGROK_URL/api/webhooks/gmail"
echo ""
echo "Dashboard: http://localhost:$PORT"
echo ""
echo "Stop with Ctrl+C"

# Keep running
wait
