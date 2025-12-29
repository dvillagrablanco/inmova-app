#!/bin/bash
# Quick SSH deploy with live monitoring

ssh root@157.180.119.236 << 'ENDSSH'
cd /opt/inmova-app
echo "📥 Pulling..."
git pull origin main

echo "🏗️  Deploying..."
bash scripts/deploy-direct.sh 2>&1 | grep -v "npm warn"

echo ""
echo "📊 Checking containers..."
sleep 5
docker ps -a | grep inmova-app_app

echo ""
echo "📋 Checking container contents..."
docker exec inmova-app-production ls -la /app 2>/dev/null || echo "Container not running"

echo ""
echo "✅ Done! Check https://inmovaapp.com"
ENDSSH
