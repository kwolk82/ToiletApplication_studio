#!/usr/bin/env bash
set -euo pipefail

PORT=${1:-3000}

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found. Install from https://ngrok.com/download"
  exit 1
fi

# Start ngrok if not running
if ! curl -s localhost:4040/api/tunnels >/dev/null 2>&1; then
  echo "Starting ngrok on port ${PORT}..."
  (ngrok http ${PORT} >/dev/null 2>&1 &)
  # wait for API
  for i in {1..20}; do
    sleep 0.5
    if curl -s localhost:4040/api/tunnels >/dev/null 2>&1; then break; fi
  done
fi

# Query public URL (https)
PUBLIC_URL=$(curl -s localhost:4040/api/tunnels | python - <<'PY'
import sys, json
data=json.load(sys.stdin)
for t in data.get('tunnels', []):
    url=t.get('public_url','')
    if url.startswith('https://'):
        print(url); break
PY
)

if [ -z "${PUBLIC_URL}" ]; then
  echo "Could not resolve ngrok public https URL."
  exit 1
fi

echo "Tunnel URL: ${PUBLIC_URL}"

# Write .env (in current working directory)
echo "API_BASE_URL=${PUBLIC_URL}" > .env
echo "KAKAO_JAVASCRIPT_KEY=${KAKAO_JAVASCRIPT_KEY:-e305950d640265b7607964545cf2aa75}" >> .env
echo ".env updated."

# Start Expo with env
API_BASE_URL="${PUBLIC_URL}" npx expo start --tunnel
