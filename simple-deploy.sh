#!/bin/bash
TOKEN="mrahnG6wAoMRYDyGA9sWXGQH"

echo "🚀 Intentando deployment simple..."
echo ""

# Método 1: Deploy directo
echo "Método 1: vercel deploy"
vercel deploy --token="$TOKEN" <<EOF
yes
inmova
./
n
EOF
