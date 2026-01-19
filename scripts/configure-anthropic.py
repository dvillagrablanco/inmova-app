#!/usr/bin/env python3
"""
Script para configurar ANTHROPIC_API_KEY en producción
Uso: python3 scripts/configure-anthropic.py sk-ant-api03-xxx
"""

import sys
import os

# Add paramiko to path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Error: paramiko no instalado. Ejecutar: pip install paramiko")
    sys.exit(1)

# Configuración
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    print(f"{color}{msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode().strip()
    error = stderr.read().decode().strip()
    return exit_status, output, error

def main():
    if len(sys.argv) < 2:
        print(f"""
{Colors.BOLD}🔑 Configurar ANTHROPIC_API_KEY{Colors.RESET}

{Colors.CYAN}Uso:{Colors.RESET}
    python3 scripts/configure-anthropic.py <API_KEY>

{Colors.CYAN}Ejemplo:{Colors.RESET}
    python3 scripts/configure-anthropic.py sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx

{Colors.YELLOW}Para obtener una API Key:{Colors.RESET}
    1. Ir a: https://console.anthropic.com/settings/keys
    2. Crear una cuenta o iniciar sesión
    3. Click en "Create Key"
    4. Copiar la key (formato: sk-ant-api03-...)

{Colors.YELLOW}Nota:{Colors.RESET} La key comienza con 'sk-ant-'
        """)
        sys.exit(1)

    api_key = sys.argv[1].strip()

    # Validar formato de la key
    if not api_key.startswith('sk-ant-'):
        log("❌ Error: La API Key debe comenzar con 'sk-ant-'", Colors.RED)
        log("   Formato esperado: sk-ant-api03-xxxxxxxxxxxxxxxxx", Colors.YELLOW)
        sys.exit(1)

    if len(api_key) < 30:
        log("❌ Error: La API Key parece muy corta", Colors.RED)
        sys.exit(1)

    log(f"\n{Colors.BOLD}🔑 Configurando ANTHROPIC_API_KEY en producción{Colors.RESET}")
    log(f"   Servidor: {SERVER_IP}")
    log(f"   Key: {api_key[:15]}...{api_key[-4:]}")
    print()

    try:
        # Conectar
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=15)
        log("✅ Conectado", Colors.GREEN)

        # Verificar si ya existe
        log("\n📋 Verificando configuración actual...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f'grep ANTHROPIC {APP_PATH}/.env.production || echo ""')
        
        if output and 'ANTHROPIC_API_KEY' in output:
            log("⚠️  ANTHROPIC_API_KEY ya existe, se actualizará", Colors.YELLOW)
            # Reemplazar línea existente
            cmd = f"sed -i 's/^ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY={api_key}/' {APP_PATH}/.env.production"
        else:
            log("➕ Añadiendo ANTHROPIC_API_KEY...", Colors.CYAN)
            # Añadir al final del archivo
            cmd = f"echo 'ANTHROPIC_API_KEY={api_key}' >> {APP_PATH}/.env.production"
        
        status, output, error = exec_cmd(client, cmd)
        if status != 0:
            log(f"❌ Error añadiendo key: {error}", Colors.RED)
            sys.exit(1)

        # Añadir configuración adicional si no existe
        log("📝 Configurando variables adicionales...", Colors.CYAN)
        
        # ANTHROPIC_MODEL
        status, output, _ = exec_cmd(client, f'grep ANTHROPIC_MODEL {APP_PATH}/.env.production || echo ""')
        if not output or 'ANTHROPIC_MODEL' not in output:
            exec_cmd(client, f"echo 'ANTHROPIC_MODEL=claude-3-5-sonnet-20241022' >> {APP_PATH}/.env.production")
        
        # ANTHROPIC_MAX_TOKENS
        status, output, _ = exec_cmd(client, f'grep ANTHROPIC_MAX_TOKENS {APP_PATH}/.env.production || echo ""')
        if not output or 'ANTHROPIC_MAX_TOKENS' not in output:
            exec_cmd(client, f"echo 'ANTHROPIC_MAX_TOKENS=4096' >> {APP_PATH}/.env.production")

        log("✅ Variables configuradas", Colors.GREEN)

        # Reiniciar PM2
        log("\n🔄 Reiniciando PM2 con nuevas variables...", Colors.CYAN)
        status, output, error = exec_cmd(client, f'cd {APP_PATH} && pm2 restart inmova-app --update-env', timeout=60)
        if status != 0:
            log(f"⚠️  Advertencia al reiniciar PM2: {error}", Colors.YELLOW)
        else:
            log("✅ PM2 reiniciado", Colors.GREEN)

        # Esperar warm-up
        log("\n⏳ Esperando warm-up (10s)...", Colors.CYAN)
        import time
        time.sleep(10)

        # Verificar
        log("\n🏥 Verificando configuración...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f'grep ANTHROPIC {APP_PATH}/.env.production')
        log(f"   Configuración en .env.production:", Colors.CYAN)
        for line in output.split('\n'):
            if 'KEY' in line:
                # Ocultar la mayor parte de la key
                parts = line.split('=')
                if len(parts) == 2:
                    key = parts[1]
                    masked = key[:15] + '...' + key[-4:] if len(key) > 20 else key
                    log(f"   {parts[0]}={masked}", Colors.GREEN)
            else:
                log(f"   {line}", Colors.GREEN)

        # Test de conexión
        log("\n🧪 Probando conexión con Claude...", Colors.CYAN)
        test_cmd = f'''
cd {APP_PATH} && node -e "
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({{ apiKey: '{api_key}' }});

async function test() {{
    try {{
        const msg = await client.messages.create({{
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 50,
            messages: [{{ role: 'user', content: 'Di solo: OK' }}]
        }});
        console.log('SUCCESS:', msg.content[0].text);
    }} catch (e) {{
        console.log('ERROR:', e.message);
    }}
}}
test();
" 2>&1
'''
        status, output, error = exec_cmd(client, test_cmd, timeout=30)
        
        if 'SUCCESS' in output:
            log("✅ Conexión con Claude verificada!", Colors.GREEN)
            log(f"   Respuesta: {output}", Colors.CYAN)
        elif 'ERROR' in output:
            log(f"⚠️  Error en test: {output}", Colors.YELLOW)
            log("   La key puede ser inválida o la cuenta no tiene créditos", Colors.YELLOW)
        else:
            log(f"⚠️  Resultado del test: {output}", Colors.YELLOW)

        client.close()

        log(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        log(f"{Colors.GREEN}✅ CONFIGURACIÓN COMPLETADA{Colors.RESET}")
        log(f"{'='*60}")
        log(f"\n{Colors.CYAN}Para probar:{Colors.RESET}")
        log(f"   1. Ir a: https://inmovaapp.com/asistente-ia")
        log(f"   2. Seleccionar un agente")
        log(f"   3. Enviar un mensaje de prueba")
        log(f"\n{Colors.CYAN}Para verificar vía API:{Colors.RESET}")
        log(f"   curl https://inmovaapp.com/api/admin/ai-agents/test")
        print()

    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        sys.exit(1)

if __name__ == '__main__':
    main()
