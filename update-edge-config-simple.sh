#!/bin/bash

# Simple script to update Edge Config with books data
# Usage: ./update-edge-config-simple.sh <vercel-token>

if [ -z "$1" ]; then
    echo "Usage: ./update-edge-config-simple.sh <vercel-token>"
    echo "Get your token from: https://vercel.com/account/tokens"
    exit 1
fi

VERCEL_TOKEN="$1"
EDGE_CONFIG_ID="ecfg_vrbccwwqmylae9vpbkcuvaldrmmg"

echo "Reading Edge Config data..."
DATA=$(cat edge-config-data.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(json.dumps(d['value']))")

echo "Updating Edge Config..."
curl -X PATCH "https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"operation\":\"upsert\",\"key\":\"cached_books\",\"value\":${DATA}}]}"

echo ""
echo "✓ Done!"
