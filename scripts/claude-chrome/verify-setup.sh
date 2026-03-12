#!/bin/bash
# ============================================================================
# VERIFY CLAUDE CHROME SETUP
# ============================================================================
# Verifica que todos los componentes están instalados correctamente.
# ============================================================================

set -e

export PATH="$HOME/.local/bin:$PATH"

PASS=0
FAIL=0
WARN=0

check() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo "  [OK] $name"
        PASS=$((PASS + 1))
    else
        echo "  [FAIL] $name"
        FAIL=$((FAIL + 1))
    fi
}

warn_check() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo "  [OK] $name"
        PASS=$((PASS + 1))
    else
        echo "  [WARN] $name"
        WARN=$((WARN + 1))
    fi
}

echo "============================================"
echo "  Verificación Claude Chrome Setup"
echo "============================================"
echo ""

echo "1. Componentes del servidor:"
check "Claude Code CLI" "claude --version"
check "Node.js >= 18" "node -e 'process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)'"
check "npm" "npm --version"
check "Google Chrome" "google-chrome --version"
check "chrome-devtools-mcp" "npx chrome-devtools-mcp@latest --version"
echo ""

echo "2. Configuración:"
check "~/.claude/settings.json existe" "test -f ~/.claude/settings.json"
check "MCP config tiene chrome-devtools" "grep -q 'chrome-devtools' ~/.claude/settings.json 2>/dev/null"
check "Scripts ejecutables" "test -x /workspace/scripts/claude-chrome/start-claude-chrome.sh"
echo ""

echo "3. Conectividad Chrome (puerto 9222):"
warn_check "Chrome remoto en puerto 9222" "curl -sf http://127.0.0.1:9222/json/version"
echo ""

if curl -sf "http://127.0.0.1:9222/json/version" > /dev/null 2>&1; then
    echo "  Info Chrome conectado:"
    curl -s "http://127.0.0.1:9222/json/version" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'    Browser:    {d.get(\"Browser\", \"?\")}')
print(f'    Protocol:   {d.get(\"Protocol-Version\", \"?\")}')
print(f'    User-Agent: {d.get(\"User-Agent\", \"?\")[:60]}...')
" 2>/dev/null || true
    echo ""
    
    echo "  Pestanas abiertas:"
    curl -s "http://127.0.0.1:9222/json" | python3 -c "
import sys, json
tabs = json.load(sys.stdin)
for t in tabs[:5]:
    title = t.get('title', '?')[:50]
    url = t.get('url', '?')[:60]
    print(f'    - {title}')
    print(f'      {url}')
" 2>/dev/null || true
    echo ""
fi

echo "============================================"
echo "  Resultado: $PASS OK, $FAIL FAIL, $WARN WARN"
echo "============================================"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "Hay componentes faltantes. Revisa los [FAIL] arriba."
    exit 1
elif [ $WARN -gt 0 ]; then
    echo ""
    echo "Servidor listo. Chrome no conectado aun."
    echo ""
    echo "Para conectar tu Chrome:"
    echo "  1. En TU ORDENADOR abre Chrome con debugging:"
    echo "     macOS:   open -a 'Google Chrome' --args --remote-debugging-port=9222"
    echo "     Windows: chrome.exe --remote-debugging-port=9222"  
    echo "     Linux:   google-chrome --remote-debugging-port=9222"
    echo ""
    echo "  2. Crea el tunel SSH:"
    echo "     ssh -R 9222:localhost:9222 usuario@IP_SERVIDOR"
    echo ""
    echo "  3. En el servidor ejecuta:"
    echo "     ./scripts/claude-chrome/start-claude-chrome.sh --mcp"
    exit 0
else
    echo ""
    echo "Todo listo. Puedes usar Claude Chrome."
    echo ""
    echo "Ejecuta:"
    echo "  ./scripts/claude-chrome/start-claude-chrome.sh --mcp"
    exit 0
fi
