# Claude Chrome - Guia de Configuracion

## Que es Claude Chrome

Claude Chrome permite que **Claude Code** (ejecutandose en el servidor/terminal) interactue con tu **navegador Chrome** local. Puede:

- Leer el contenido de paginas web
- Inspeccionar el DOM
- Ejecutar JavaScript
- Capturar screenshots
- Monitorear requests de red
- Leer la consola del navegador

## Componentes Instalados en el Servidor

| Componente | Version | Ubicacion |
|---|---|---|
| Claude Code CLI | 2.1.74 | `~/.local/bin/claude` |
| Chrome DevTools MCP | 0.20.0 | via npx (global) |
| Google Chrome | 146 | `/usr/bin/google-chrome` |
| Node.js | 22.x | via nvm |

## Arquitectura

```
TU ORDENADOR                          SERVIDOR
+------------------+                  +---------------------------+
|                  |   SSH Tunnel     |                           |
| Chrome Browser   | <=============> | Claude Code CLI           |
| puerto 9222      |   -R 9222       | + Chrome DevTools MCP     |
|                  |                  |   (lee tu Chrome)         |
+------------------+                  +---------------------------+
```

## Setup Rapido (3 pasos)

### Paso 1: En TU ORDENADOR - Abrir Chrome con debugging

**macOS:**
```bash
# Cerrar Chrome primero, luego:
open -a "Google Chrome" --args --remote-debugging-port=9222
```

**Windows (CMD):**
```cmd
taskkill /F /IM chrome.exe
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**Windows (PowerShell):**
```powershell
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**Linux:**
```bash
pkill chrome; google-chrome --remote-debugging-port=9222
```

> Verifica que funciona abriendo `http://localhost:9222/json/version` en otro navegador. Debes ver un JSON con info de Chrome.

### Paso 2: En TU ORDENADOR - Crear tunel SSH

Esto reenvía el puerto 9222 de tu Chrome al servidor:

```bash
ssh -R 9222:localhost:9222 root@157.180.119.236
```

O con clave SSH:
```bash
ssh -R 9222:localhost:9222 -i ~/.ssh/mi_clave root@157.180.119.236
```

> Mantén esta terminal abierta mientras uses Claude Chrome.

### Paso 3: En el SERVIDOR - Iniciar Claude Code

```bash
cd /workspace
./scripts/claude-chrome/start-claude-chrome.sh --mcp
```

## Modos de Uso

### Modo 1: MCP + Tu Chrome (RECOMENDADO)

Conecta Claude Code del servidor a TU Chrome local. Ideal para:
- Debugging de tu aplicacion web
- Testing visual de cambios
- Inspeccion de red y consola

```bash
./scripts/claude-chrome/start-claude-chrome.sh --mcp
```

**Requiere:** Chrome con debugging + tunel SSH (pasos 1 y 2 arriba).

### Modo 2: Chrome Headless del Servidor

Usa el Chrome del servidor sin interfaz grafica. Ideal para:
- Scraping
- Automatizacion
- Tests E2E
- No necesitas conectar tu Chrome

```bash
./scripts/claude-chrome/start-claude-chrome.sh --headless
```

**No requiere** tunel SSH ni configuracion en tu ordenador.

### Modo 3: Extension "Claude in Chrome"

Usa la extension oficial de Anthropic. Requiere:
- Plan Anthropic (Pro/Max/Teams/Enterprise)
- Extension instalada en tu Chrome

```bash
./scripts/claude-chrome/start-claude-chrome.sh --chrome
```

## Verificar Instalacion

```bash
./scripts/claude-chrome/verify-setup.sh
```

## Uso con Script Automatizado (Windows)

Descarga y ejecuta el `.bat`:
```cmd
setup-local-chrome.bat root@157.180.119.236
```

O el `.sh` (macOS/Linux):
```bash
./setup-local-chrome.sh --server root@157.180.119.236
```

## Troubleshooting

### Chrome no se conecta

1. Verifica que Chrome esta corriendo con debugging:
   ```
   curl http://localhost:9222/json/version
   ```

2. Verifica el tunel SSH:
   ```bash
   # En el servidor
   curl http://127.0.0.1:9222/json/version
   ```

3. Si el tunel falla, prueba con puerto explicito:
   ```bash
   ssh -R 0.0.0.0:9222:localhost:9222 root@servidor
   ```

### "Address already in use" en el tunel

Otro proceso usa el puerto 9222 en el servidor:
```bash
# En el servidor
fuser -k 9222/tcp
```

### Chrome se cierra al abrir con debugging

Cierra TODAS las instancias de Chrome primero. Solo puede haber una instancia con debugging port activo.

### MCP no detecta Chrome

Reinicia el MCP server:
```bash
# En el servidor
./scripts/claude-chrome/start-chrome-server.sh
```

### Claude Code no tiene permisos MCP

Verifica la config:
```bash
cat ~/.claude/settings.json
```

Debe contener:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
    }
  }
}
```

## Comandos Utiles

```bash
# Ver estado de todo
./scripts/claude-chrome/verify-setup.sh

# Iniciar con MCP (requiere tunel)
./scripts/claude-chrome/start-claude-chrome.sh --mcp

# Iniciar headless (sin tunel)
./scripts/claude-chrome/start-claude-chrome.sh --headless

# Solo el servidor MCP
./scripts/claude-chrome/start-chrome-server.sh

# Verificar Chrome remoto
curl -s http://127.0.0.1:9222/json/version | python3 -m json.tool

# Ver pestanas abiertas
curl -s http://127.0.0.1:9222/json | python3 -m json.tool
```
