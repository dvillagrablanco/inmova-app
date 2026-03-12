#!/bin/bash
# ============================================================================
# START CLAUDE CODE WITH CHROME INTEGRATION
# ============================================================================
# Inicia Claude Code CLI con la extensión Chrome habilitada.
#
# Modos de uso:
#   1. --chrome    : Usa la extensión "Claude in Chrome" (requiere extensión)
#   2. --mcp       : Usa Chrome DevTools MCP (requiere túnel SSH o Chrome local)
#   3. --headless  : Inicia Chrome headless en servidor + MCP
#
# Uso:
#   ./start-claude-chrome.sh [--chrome|--mcp|--headless]
# ============================================================================

set -e

export PATH="$HOME/.local/bin:$PATH"

MODE="${1:---mcp}"
PORT=9222

case "$MODE" in
    --chrome)
        echo "============================================"
        echo "  Claude Code + Chrome Extension"
        echo "============================================"
        echo ""
        echo "Requisitos en tu ordenador:"
        echo "  1. Extensión 'Claude in Chrome' instalada en Chrome"
        echo "     https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn"
        echo "  2. Sesión activa en Anthropic (Pro/Max/Teams/Enterprise)"
        echo ""
        echo "Iniciando Claude Code con --chrome..."
        exec claude --chrome
        ;;

    --mcp)
        echo "============================================"
        echo "  Claude Code + Chrome DevTools MCP"
        echo "============================================"
        echo ""
        echo "Conectando a Chrome via MCP (puerto $PORT)..."
        echo ""

        if curl -s "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
            echo "Chrome detectado en puerto $PORT"
        else
            echo "Chrome NO detectado en puerto $PORT."
            echo ""
            echo "En tu ordenador, ejecuta:"
            echo "  1. Abre Chrome con debugging:"
            echo "     Windows:  start chrome --remote-debugging-port=$PORT"
            echo "     macOS:    open -a 'Google Chrome' --args --remote-debugging-port=$PORT"
            echo "     Linux:    google-chrome --remote-debugging-port=$PORT"
            echo ""
            echo "  2. Crea el túnel SSH:"
            echo "     ssh -R $PORT:localhost:$PORT usuario@IP_SERVIDOR"
            echo ""
            exit 1
        fi

        exec claude --mcp-config ~/.claude/settings.json
        ;;

    --headless)
        echo "============================================"
        echo "  Claude Code + Chrome Headless (Servidor)"
        echo "============================================"
        echo ""

        pkill -f "chrome.*remote-debugging-port=$PORT" 2>/dev/null || true
        sleep 1

        echo "Iniciando Chrome headless en puerto $PORT..."
        google-chrome \
            --headless=new \
            --no-sandbox \
            --disable-gpu \
            --remote-debugging-port=$PORT \
            --remote-debugging-address=127.0.0.1 \
            --user-data-dir=/tmp/chrome-mcp-profile \
            --window-size=1920,1080 &

        sleep 3

        if curl -s "http://127.0.0.1:$PORT/json/version" > /dev/null 2>&1; then
            echo "Chrome headless iniciado correctamente."
        else
            echo "Error: Chrome headless no se pudo iniciar."
            exit 1
        fi

        exec claude --mcp-config ~/.claude/settings.json
        ;;

    -h|--help)
        echo "Uso: $0 [modo]"
        echo ""
        echo "Modos:"
        echo "  --chrome     Usa extensión 'Claude in Chrome' (requiere extensión en tu Chrome)"
        echo "  --mcp        Usa Chrome DevTools MCP (requiere túnel SSH + Chrome con debugging)"
        echo "  --headless   Usa Chrome headless del servidor + MCP (no necesita tu Chrome)"
        echo ""
        echo "Recomendaciones:"
        echo "  Para debugging de tu app web  -> --mcp (conecta a TU Chrome)"
        echo "  Para automatización/scraping  -> --headless (Chrome del servidor)"
        echo "  Para extensión oficial Claude -> --chrome"
        ;;

    *)
        echo "Modo desconocido: $MODE"
        echo "Usa --help para ver opciones."
        exit 1
        ;;
esac
