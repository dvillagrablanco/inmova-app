#!/bin/bash

echo "🔍 Probando pantalla blanca en servidor remoto..."

ssh root@157.180.119.236 'cd /opt/inmova-app && pm2 logs inmova-app --lines 50 --nostream | grep -i "error\|warning\|white" || echo "No errors found"'

