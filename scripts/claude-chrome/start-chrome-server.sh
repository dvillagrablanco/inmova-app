#!/bin/bash
# ============================================================================
# START CHROME DEVTOOLS MCP SERVER
# ============================================================================
# Este script inicia el servidor Chrome DevTools MCP en el servidor,
# esperando conexión desde el navegador Chrome local del usuario.
#
# REQUISITO: El usuario debe tener un túnel SSH activo que reenvíe
# el puerto 9222 de su Chrome local al puerto 9222 del servidor.
#
# Uso:
#   ./start-chrome-server.sh [--headless] [--port PORT]
# ============================================================================

set -e

PORT="${2:-9222}"
HEADLESS=false
MODE="remote"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --headless) HEADLESS=true ;;
        --port) PORT="$2"; shift ;;
        --local) MODE="local" ;;
        -h|--help)
            echo "Uso: $0 [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --port PORT    Puerto de Chrome DevTools (default: 9222)"
            echo "  --headless     Usar Chrome headless del servidor"
            echo "  --local        Iniciar Chrome local del servidor"
            echo "  -h, --help     Mostrar ayuda"
            echo ""
            echo "Modos:"
            echo "  (default)  Conecta al Chrome remoto via túnel SSH en puerto $PORT"
            echo "  --local    Inicia Chrome en el servidor (headless recomendado)"
            exit 0
            ;;
        *) echo "Opción desconocida: $1"; exit 1 ;;
    esac
    shift
done

echo "============================================"
echo "  Chrome DevTools MCP Server"
echo "============================================"
echo ""

if [ "$MODE" = "local" ]; then
    echo "Modo: Chrome LOCAL del servidor"
    if [ "$HEADLESS" = true ]; then
        echo "Iniciando Chrome headless en puerto $PORT..."
        google-chrome \
            --headless=new \
            --no-sandbox \
            --disable-gpu \
            --remote-debugging-port=$PORT \
            --remote-debugging-address=0.0.0.0 \
            --user-data-dir=/tmp/chrome-mcp-profile &
        CHROME_PID=$!
        echo "Chrome PID: $CHROME_PID"
        sleep 2
    else
        echo "Iniciando Chrome con GUI en puerto $PORT..."
        google-chrome \
            --no-sandbox \
            --remote-debugging-port=$PORT \
            --user-data-dir=/tmp/chrome-mcp-profile &
        CHROME_PID=$!
        sleep 2
    fi
    echo "Chrome iniciado. Conectando MCP..."
else
    echo "Modo: Chrome REMOTO (via SSH tunnel)"
    echo "Puerto esperado: $PORT"
    echo ""

    echo "Verificando conexión al puerto $PORT..."
    if curl -s "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
        VERSION_INFO=$(curl -s "http://127.0.0.1:$PORT/json/version")
        echo "Chrome detectado:"
        echo "$VERSION_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Browser: {d.get(\"Browser\",\"?\")}')" 2>/dev/null || true
        echo ""
    else
        echo "No se detecta Chrome en puerto $PORT."
        echo ""
        echo "Asegurate de:"
        echo "  1. Abrir Chrome con: --remote-debugging-port=$PORT"
        echo "  2. Crear túnel SSH: ssh -R $PORT:localhost:$PORT usuario@servidor"
        echo ""
        echo "Esperando conexión..."
        for i in $(seq 1 30); do
            if curl -s "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
                echo "Chrome conectado."
                break
            fi
            sleep 2
            echo -n "."
        done
        echo ""

        if ! curl -s "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
            echo "TIMEOUT: No se pudo conectar a Chrome en puerto $PORT"
            echo "Verifica el túnel SSH y que Chrome esté corriendo."
            exit 1
        fi
    fi
fi

echo "Iniciando Chrome DevTools MCP Server..."
echo "============================================"
exec npx chrome-devtools-mcp@latest --browserUrl "http://127.0.0.1:$PORT"
