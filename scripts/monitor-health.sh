#!/bin/bash
###############################################################################
# Monitor Health - Health Check Automatizado con Alertas
# Ejecutar vía cron cada 5 minutos
###############################################################################

set -e

# Configuración
APP_URL="${APP_URL:-http://localhost:3000}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@inmova.app}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
LOG_FILE="/var/log/inmova/health-monitor.log"
ALERT_FILE="/tmp/inmova-health-alert"
MAX_RETRIES=3

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función de alerta
alert() {
    local message="$1"
    log "🚨 ALERT: $message"
    
    # Evitar spam: solo alertar una vez cada 30 minutos
    if [ -f "$ALERT_FILE" ]; then
        local last_alert=$(stat -c %Y "$ALERT_FILE")
        local now=$(date +%s)
        local diff=$((now - last_alert))
        
        if [ $diff -lt 1800 ]; then
            log "⏱️  Skipping alert (last alert ${diff}s ago)"
            return
        fi
    fi
    
    touch "$ALERT_FILE"
    
    # Slack
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚨 Inmova Health Alert: $message\"}" \
            2>/dev/null || true
    fi
    
    # Email (requiere mailutils instalado)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "Inmova Health Alert" "$ALERT_EMAIL" || true
    fi
}

# Test 1: HTTP Health Check
test_http() {
    local url="$1"
    local max_time=10
    
    log "🔍 Testing HTTP: $url"
    
    for i in $(seq 1 $MAX_RETRIES); do
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $max_time "$url" 2>/dev/null || echo "000")
        
        if [ "$http_code" = "200" ]; then
            log "   ✅ HTTP OK (${http_code})"
            return 0
        else
            log "   ⚠️  HTTP ${http_code} (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep 5
            fi
        fi
    done
    
    alert "HTTP health check failed: $url returned $http_code"
    return 1
}

# Test 2: API Health Endpoint
test_api_health() {
    log "🔍 Testing API health endpoint"
    
    local response=$(curl -s --max-time 10 "${APP_URL}/api/health" 2>/dev/null || echo "{}")
    local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "error")
    
    if [ "$status" = "ok" ]; then
        log "   ✅ API health OK"
        return 0
    else
        alert "API health endpoint returned: $status"
        return 1
    fi
}

# Test 3: Process Check
test_process() {
    log "🔍 Checking Next.js process"
    
    if pgrep -f "next-server" > /dev/null; then
        local pid=$(pgrep -f "next-server" | head -1)
        log "   ✅ Process running (PID: $pid)"
        return 0
    elif pm2 list | grep -q "inmova-app.*online"; then
        log "   ✅ PM2 process online"
        return 0
    else
        alert "No Next.js process found!"
        return 1
    fi
}

# Test 4: Port Check
test_port() {
    log "🔍 Checking port 3000"
    
    if ss -tlnp | grep -q ":3000"; then
        log "   ✅ Port 3000 listening"
        return 0
    else
        alert "Port 3000 not listening!"
        return 1
    fi
}

# Test 5: Database Connection
test_database() {
    log "🔍 Checking database connection"
    
    if [ -f "/opt/inmova-app/package.json" ]; then
        cd /opt/inmova-app
        export $(cat .env.production | xargs 2>/dev/null || true)
        
        if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
            log "   ✅ Database connected"
            return 0
        else
            alert "Database connection failed!"
            return 1
        fi
    else
        log "   ⚠️  Skipping DB check (app not found)"
        return 0
    fi
}

# Test 6: Memory Usage
test_memory() {
    log "🔍 Checking memory usage"
    
    local mem_used=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ $mem_used -lt 90 ]; then
        log "   ✅ Memory OK (${mem_used}%)"
        return 0
    else
        alert "High memory usage: ${mem_used}%"
        return 1
    fi
}

# Test 7: Disk Space
test_disk() {
    log "🔍 Checking disk space"
    
    local disk_used=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $disk_used -lt 90 ]; then
        log "   ✅ Disk OK (${disk_used}%)"
        return 0
    else
        alert "Low disk space: ${disk_used}%"
        return 1
    fi
}

# Test 8: Login Page Availability
test_login() {
    log "🔍 Testing login page"
    
    local response=$(curl -s --max-time 10 "${APP_URL}/login" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "email"; then
        log "   ✅ Login page OK"
        return 0
    else
        alert "Login page not rendering properly"
        return 1
    fi
}

# Auto-Recovery
auto_recover() {
    log "🔧 Attempting auto-recovery..."
    
    # Restart with PM2
    if command -v pm2 &> /dev/null; then
        log "   → Restarting with PM2..."
        pm2 restart inmova-app 2>&1 | tee -a "$LOG_FILE"
        sleep 10
        return 0
    fi
    
    # Restart manual process
    if [ -f "/opt/inmova-app/package.json" ]; then
        log "   → Restarting manually..."
        cd /opt/inmova-app
        fuser -k 3000/tcp || true
        sleep 2
        export $(cat .env.production | xargs)
        nohup npm start > /tmp/inmova.log 2>&1 &
        sleep 10
        return 0
    fi
    
    log "   ❌ Auto-recovery failed"
    return 1
}

# Main
main() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "🏥 HEALTH CHECK STARTING"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local failed=0
    local total=8
    
    # Run all tests
    test_http "$APP_URL" || ((failed++))
    test_api_health || ((failed++))
    test_process || ((failed++))
    test_port || ((failed++))
    test_database || ((failed++))
    test_memory || ((failed++))
    test_disk || ((failed++))
    test_login || ((failed++))
    
    # Summary
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ $failed -eq 0 ]; then
        log "✅ ALL CHECKS PASSED ($total/$total)"
        # Clear alert file on success
        rm -f "$ALERT_FILE"
        exit 0
    else
        log "❌ CHECKS FAILED: $failed/$total"
        
        # Attempt auto-recovery if critical
        if [ $failed -ge 3 ]; then
            auto_recover
            
            # Re-test after recovery
            log "🔄 Re-testing after recovery..."
            sleep 5
            test_http "$APP_URL" && test_api_health && log "✅ Recovery successful" && exit 0
        fi
        
        exit 1
    fi
}

# Crear log dir si no existe
mkdir -p "$(dirname "$LOG_FILE")"

# Run
main
