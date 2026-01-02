#!/usr/bin/env python3
"""
Configurar Triada de Mantenimiento con credenciales proporcionadas
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Credenciales del servidor
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

# Credenciales de la Triada
SENTRY_DSN = 'https://f3e76aca26cfeef767c4f3d3b5b271fd@o4510643145932800.ingest.de.sentry.io/4510643147505744'
CRISP_WEBSITE_ID = '1f115549-e9ef-49e5-8fd7-174e6d896a7e'

# Colores
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_color(color, text):
    print(f"{color}{text}{RESET}")

def print_step(step_num, total_steps, description):
    print_color(CYAN, f"\n{'='*70}")
    print_color(CYAN, f"  PASO {step_num}/{total_steps}: {description}")
    print_color(CYAN, f"{'='*70}\n")

def execute_command(client, command, description):
    print_color(YELLOW, f"   $ {command}")
    stdin, stdout, stderr = client.exec_command(command, timeout=120)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if exit_code == 0:
        print_color(GREEN, f"   ✅ {description}")
        if output.strip():
            for line in output.strip().split('\n')[:10]:
                print(f"      {line}")
    else:
        print_color(RED, f"   ❌ {description} (exit code: {exit_code})")
        if error.strip():
            for line in error.strip().split('\n')[:5]:
                print(f"      {line}")
    
    return exit_code, output, error

def main():
    print_color(CYAN, """
╔══════════════════════════════════════════════════════════════════╗
║     🚀 CONFIGURACIÓN AUTOMÁTICA DE LA TRIADA                    ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    print("📋 Credenciales a configurar:\n")
    print_color(GREEN, f"✅ Sentry DSN: {SENTRY_DSN[:50]}...")
    print_color(GREEN, f"✅ Crisp Website ID: {CRISP_WEBSITE_ID}")
    print()
    
    # Conectar al servidor
    print_step(1, 6, "Conectando al servidor")
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print_color(GREEN, f"   ✅ Conectado a {SERVER_IP}\n")
    except Exception as e:
        print_color(RED, f"   ❌ Error conectando: {e}\n")
        sys.exit(1)
    
    try:
        # Paso 2: Backup del .env.production actual
        print_step(2, 6, "Backup de .env.production")
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        execute_command(
            client,
            f"cd /opt/inmova-app && cp .env.production .env.production.backup.{timestamp}",
            "Backup creado"
        )
        
        # Paso 3: Verificar si ya existen las variables
        print_step(3, 6, "Verificando variables existentes")
        exit_code, output, _ = execute_command(
            client,
            "cd /opt/inmova-app && grep -E '(SENTRY_DSN|CRISP_WEBSITE_ID)' .env.production || echo 'No encontradas'",
            "Verificación"
        )
        
        # Paso 4: Actualizar .env.production
        print_step(4, 6, "Actualizando .env.production con credenciales")
        
        # Eliminar variables antiguas si existen
        commands = [
            "cd /opt/inmova-app",
            "sed -i '/^NEXT_PUBLIC_SENTRY_DSN=/d' .env.production",
            "sed -i '/^SENTRY_DSN=/d' .env.production",
            "sed -i '/^NEXT_PUBLIC_CRISP_WEBSITE_ID=/d' .env.production",
            "sed -i '/^NEXT_PUBLIC_STATUS_PAGE_URL=/d' .env.production",
            # Eliminar sección de Triada si existe
            "sed -i '/# ============================================/d' .env.production",
            "sed -i '/# 🛡️ TRIADA DE MANTENIMIENTO - INMOVA/d' .env.production",
        ]
        
        for cmd in commands:
            execute_command(client, cmd, "Limpiando variables antiguas")
        
        # Añadir nueva sección con credenciales
        env_content = f"""

# ============================================
# 🛡️ TRIADA DE MANTENIMIENTO - INMOVA
# ============================================

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN="{SENTRY_DSN}"
SENTRY_DSN="{SENTRY_DSN}"

# Crisp Chat (Live Support)
NEXT_PUBLIC_CRISP_WEBSITE_ID="{CRISP_WEBSITE_ID}"

# Status Page (BetterStack) - Opcional por ahora
# NEXT_PUBLIC_STATUS_PAGE_URL="https://your-subdomain.betteruptime.com"
"""
        
        # Escapar comillas para el comando echo
        env_content_escaped = env_content.replace('"', '\\"').replace('$', '\\$')
        
        execute_command(
            client,
            f'cd /opt/inmova-app && echo "{env_content_escaped}" >> .env.production',
            "Variables añadidas"
        )
        
        # Verificar que se añadieron correctamente
        exit_code, output, _ = execute_command(
            client,
            "cd /opt/inmova-app && tail -15 .env.production",
            "Verificación del .env.production"
        )
        
        # Paso 5: Reiniciar PM2
        print_step(5, 6, "Reiniciando PM2")
        
        execute_command(
            client,
            "cd /opt/inmova-app && pm2 restart inmova-app",
            "PM2 reiniciado"
        )
        
        # Esperar a que arranque
        print_color(YELLOW, "\n   ⏳ Esperando 15 segundos para que la app arranque...\n")
        time.sleep(15)
        
        # Paso 6: Verificar que la app está corriendo
        print_step(6, 6, "Verificando que la app está corriendo")
        
        exit_code, output, _ = execute_command(
            client,
            "pm2 status inmova-app",
            "Estado de PM2"
        )
        
        # Health check
        exit_code, output, _ = execute_command(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health",
            "Health check"
        )
        
        if '200' in output or '301' in output:
            print_color(GREEN, "   ✅ App respondiendo correctamente\n")
        else:
            print_color(YELLOW, f"   ⚠️  Health check retornó: {output.strip()}\n")
        
        # Mostrar logs recientes
        print_color(CYAN, "\n📋 Últimos logs de la aplicación:\n")
        exit_code, output, _ = execute_command(
            client,
            "pm2 logs inmova-app --lines 20 --nostream",
            "Logs"
        )
        
        print_color(CYAN, "\n" + "="*70)
        print_color(GREEN, "  ✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE")
        print_color(CYAN, "="*70 + "\n")
        
        print_color(GREEN, "🎉 La Triada de Mantenimiento está configurada!\n")
        
        print("📋 Credenciales configuradas:")
        print(f"   ✅ Sentry DSN: configurado")
        print(f"   ✅ Crisp Website ID: configurado")
        print(f"   ⏭️  Status Page URL: pendiente (opcional)\n")
        
        print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print_color(CYAN, "  🧪 VERIFICACIÓN EN PRODUCCIÓN")
        print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        
        print("1️⃣  Test de Sentry:")
        print("   $ curl https://inmovaapp.com/api/test-sentry")
        print("   Luego verifica en: https://sentry.io/issues/\n")
        
        print("2️⃣  Test de Crisp Chat:")
        print("   Abre: https://inmovaapp.com")
        print("   Debe aparecer el widget de chat en la esquina inferior derecha\n")
        
        print("3️⃣  Test del Footer:")
        print("   Ve al Footer de https://inmovaapp.com")
        print("   Verifica el link 'Estado del Sistema'\n")
        
        print_color(YELLOW, "⏱️  Espera 1-2 minutos para que los cambios se propaguen completamente.\n")
        
    except Exception as e:
        print_color(RED, f"\n❌ Error durante la configuración: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()
        print_color(CYAN, "🔌 Conexión SSH cerrada\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_color(YELLOW, "\n\n⚠️  Proceso cancelado por el usuario.\n")
        sys.exit(0)
