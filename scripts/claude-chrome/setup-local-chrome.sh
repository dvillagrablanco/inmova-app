#!/bin/bash
# ============================================================================
# SETUP LOCAL CHROME - Ejecutar en TU ORDENADOR (no en el servidor)
# ============================================================================
# Este script se ejecuta en tu máquina local para:
# 1. Abrir Chrome con remote debugging habilitado
# 2. Crear un túnel SSH reverso al servidor
#
# Uso:
#   ./setup-local-chrome.sh --server USUARIO@IP_SERVIDOR [--port 9222]
# ============================================================================

PORT=9222
SERVER=""
SSH_KEY=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --server) SERVER="$2"; shift ;;
        --port) PORT="$2"; shift ;;
        --key) SSH_KEY="-i $2"; shift ;;
        -h|--help)
            echo "Uso: $0 --server USUARIO@IP [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --server USER@IP   Servidor SSH (obligatorio)"
            echo "  --port PORT        Puerto debugging Chrome (default: 9222)"
            echo "  --key PATH         Ruta a clave SSH privada"
            echo ""
            echo "Ejemplo:"
            echo "  $0 --server root@157.180.119.236"
            echo "  $0 --server deploy@mi-servidor.com --key ~/.ssh/id_rsa"
            exit 0
            ;;
        *) echo "Opción desconocida: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$SERVER" ]; then
    echo "Error: Debes especificar --server USUARIO@IP"
    echo "Ejemplo: $0 --server root@157.180.119.236"
    exit 1
fi

echo "============================================"
echo "  Setup Local Chrome + SSH Tunnel"
echo "============================================"
echo ""
echo "Servidor: $SERVER"
echo "Puerto Chrome: $PORT"
echo ""

# Detectar OS
OS="$(uname -s)"

echo "Paso 1: Cerrando Chrome existente (si hay)..."
case "$OS" in
    Darwin)
        pkill -f "Google Chrome" 2>/dev/null || true
        ;;
    Linux)
        pkill -f "chrome" 2>/dev/null || true
        ;;
    MINGW*|MSYS*|CYGWIN*)
        taskkill /F /IM chrome.exe 2>/dev/null || true
        ;;
esac
sleep 2

echo "Paso 2: Abriendo Chrome con remote debugging en puerto $PORT..."
case "$OS" in
    Darwin)
        open -a "Google Chrome" --args \
            --remote-debugging-port=$PORT \
            --user-data-dir="$HOME/.chrome-debug-profile"
        ;;
    Linux)
        google-chrome \
            --remote-debugging-port=$PORT \
            --user-data-dir="$HOME/.chrome-debug-profile" &
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "En Windows, abre manualmente:"
        echo "  chrome.exe --remote-debugging-port=$PORT"
        echo ""
        echo "Luego pulsa Enter para continuar..."
        read -r
        ;;
esac

sleep 3

echo "Verificando Chrome local en puerto $PORT..."
if curl -s "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
    echo "Chrome OK - Debugging activo en puerto $PORT"
else
    echo "Error: Chrome no detectado en puerto $PORT"
    echo "Abre Chrome manualmente con: --remote-debugging-port=$PORT"
    exit 1
fi

echo ""
echo "Paso 3: Creando túnel SSH reverso..."
echo "  Local :$PORT -> Servidor :$PORT"
echo ""
echo "Conectando a $SERVER..."
echo "(Mantén esta terminal abierta mientras uses Claude Chrome)"
echo ""

ssh -R $PORT:localhost:$PORT $SSH_KEY -N -v "$SERVER"
