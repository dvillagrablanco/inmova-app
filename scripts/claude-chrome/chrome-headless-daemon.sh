#!/bin/bash
# ============================================================================
# CHROME HEADLESS DAEMON
# ============================================================================
# Mantiene Chrome headless corriendo en el servidor como daemon.
# Reinicia automáticamente si se cae.
#
# Uso:
#   ./chrome-headless-daemon.sh start    - Iniciar daemon
#   ./chrome-headless-daemon.sh stop     - Parar daemon
#   ./chrome-headless-daemon.sh restart  - Reiniciar
#   ./chrome-headless-daemon.sh status   - Ver estado
#   ./chrome-headless-daemon.sh navigate URL - Abrir URL
# ============================================================================

PORT=9222
PIDFILE="/tmp/chrome-headless.pid"
LOGFILE="/tmp/chrome-headless.log"
PROFILE="/tmp/chrome-mcp-profile"

start_chrome() {
    if is_running; then
        echo "Chrome headless ya está corriendo (PID: $(cat $PIDFILE))"
        return 0
    fi

    echo "Iniciando Chrome headless en puerto $PORT..."
    
    google-chrome \
        --headless=new \
        --no-sandbox \
        --disable-gpu \
        --disable-dev-shm-usage \
        --remote-debugging-port=$PORT \
        --remote-debugging-address=127.0.0.1 \
        --user-data-dir="$PROFILE" \
        --window-size=1920,1080 \
        --disable-background-networking \
        --disable-default-apps \
        --disable-sync \
        --no-first-run \
        about:blank > "$LOGFILE" 2>&1 &
    
    echo $! > "$PIDFILE"
    sleep 3

    if is_running; then
        local version
        version=$(curl -sf "http://127.0.0.1:$PORT/json/version" | python3 -c "import sys,json; print(json.load(sys.stdin)['Browser'])" 2>/dev/null)
        echo "Chrome headless iniciado: $version (PID: $(cat $PIDFILE))"
        return 0
    else
        echo "Error: Chrome no se pudo iniciar. Ver: $LOGFILE"
        return 1
    fi
}

stop_chrome() {
    if ! is_running; then
        echo "Chrome headless no está corriendo."
        rm -f "$PIDFILE"
        return 0
    fi

    local pid
    pid=$(cat "$PIDFILE")
    echo "Parando Chrome headless (PID: $pid)..."
    kill "$pid" 2>/dev/null
    sleep 2
    
    if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null
    fi
    
    rm -f "$PIDFILE"
    echo "Chrome headless parado."
}

is_running() {
    if [ -f "$PIDFILE" ]; then
        local pid
        pid=$(cat "$PIDFILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    
    if curl -sf "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

status_chrome() {
    if is_running; then
        echo "Estado: CORRIENDO"
        if [ -f "$PIDFILE" ]; then
            echo "PID: $(cat $PIDFILE)"
        fi
        
        curl -sf "http://127.0.0.1:$PORT/json/version" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Browser: {d[\"Browser\"]}')
print(f'Protocol: {d[\"Protocol-Version\"]}')
" 2>/dev/null
        
        echo ""
        echo "Pestanas:"
        curl -sf "http://127.0.0.1:$PORT/json" | python3 -c "
import sys, json
tabs = json.loads(sys.stdin.read())
pages = [t for t in tabs if t.get('type') == 'page']
print(f'  Total: {len(pages)}')
for t in pages:
    title = t.get('title', '(sin titulo)')[:50]
    url = t.get('url', '')[:70]
    print(f'  - {title}')
    print(f'    {url}')
" 2>/dev/null
    else
        echo "Estado: PARADO"
    fi
}

navigate_to() {
    local url="$1"
    if [ -z "$url" ]; then
        echo "Uso: $0 navigate URL"
        return 1
    fi

    if ! is_running; then
        echo "Chrome no está corriendo. Usa: $0 start"
        return 1
    fi

    echo "Navegando a: $url"
    curl -sf -X PUT "http://127.0.0.1:$PORT/json/new?$url" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Tab ID: {d.get(\"id\", \"?\")}')
print(f'URL: {d.get(\"url\", \"?\")}')
" 2>/dev/null

    sleep 2
    
    curl -sf "http://127.0.0.1:$PORT/json" | python3 -c "
import sys, json
tabs = json.loads(sys.stdin.read())
for t in tabs:
    if t.get('type') == 'page' and 'about:blank' not in t.get('url', ''):
        print(f'Titulo: {t.get(\"title\", \"(cargando...)\")[:60]}')
" 2>/dev/null
}

case "${1:-status}" in
    start)
        start_chrome
        ;;
    stop)
        stop_chrome
        ;;
    restart)
        stop_chrome
        sleep 1
        start_chrome
        ;;
    status)
        status_chrome
        ;;
    navigate)
        navigate_to "$2"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|navigate URL}"
        exit 1
        ;;
esac
