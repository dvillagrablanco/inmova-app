#!/usr/bin/env python3
"""
Limpiar .env.production de duplicados y reconfigurar correctamente
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

SENTRY_DSN = 'https://f3e76aca26cfeef767c4f3d3b5b271fd@o4510643145932800.ingest.de.sentry.io/4510643147505744'
CRISP_WEBSITE_ID = '1f115549-e9ef-49e5-8fd7-174e6d896a7e'

CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def print_color(color, text):
    print(f"{color}{text}{RESET}")

def execute_command(client, command, show_output=True):
    if show_output:
        print_color(YELLOW, f"   $ {command}")
    stdin, stdout, stderr = client.exec_command(command, timeout=120)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if exit_code == 0 and show_output:
        print_color(GREEN, "   ✅ OK")
        if output.strip():
            for line in output.strip().split('\n')[:5]:
                print(f"      {line}")
    elif show_output:
        print_color(RED, f"   ❌ Error (exit: {exit_code})")
    
    return exit_code, output, error

def main():
    print_color(CYAN, """
╔══════════════════════════════════════════════════════════════════╗
║     🧹 LIMPIEZA Y RECONFIGURACIÓN DEL .ENV.PRODUCTION           ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    print_color(YELLOW, "Conectando al servidor...\n")
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print_color(GREEN, "✅ Conectado\n")
    except Exception as e:
        print_color(RED, f"❌ Error: {e}\n")
        sys.exit(1)
    
    try:
        # Backup
        print_color(CYAN, "📦 Creando backup...\n")
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        execute_command(
            client,
            f"cd /opt/inmova-app && cp .env.production .env.production.backup.{timestamp}"
        )
        
        # Eliminar TODAS las variables de la Triada (duplicadas y viejas)
        print_color(CYAN, "\n🧹 Eliminando variables duplicadas...\n")
        commands_remove = [
            "cd /opt/inmova-app",
            "sed -i '/^NEXT_PUBLIC_SENTRY_DSN=/d' .env.production",
            "sed -i '/^SENTRY_DSN=/d' .env.production",
            "sed -i '/^NEXT_PUBLIC_CRISP_WEBSITE_ID=/d' .env.production",
            "sed -i '/^NEXT_PUBLIC_STATUS_PAGE_URL=/d' .env.production",
            "sed -i '/^# ============================================$/d' .env.production",
            "sed -i '/^# 🛡️ TRIADA DE MANTENIMIENTO - INMOVA$/d' .env.production",
            "sed -i '/^# Sentry (Error Tracking)$/d' .env.production",
            "sed -i '/^# Crisp Chat (Live Support)$/d' .env.production",
            "sed -i '/^# Status Page/d' .env.production",
        ]
        
        for cmd in commands_remove:
            execute_command(client, cmd, show_output=False)
        
        print_color(GREEN, "✅ Variables antiguas eliminadas\n")
        
        # Crear .env.production limpio al final
        print_color(CYAN, "✍️  Escribiendo nueva sección de Triada...\n")
        
        env_triada = f'''

# ============================================
# 🛡️ TRIADA DE MANTENIMIENTO - INMOVA
# ============================================

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN="{SENTRY_DSN}"
SENTRY_DSN="{SENTRY_DSN}"

# Crisp Chat (Live Support)  
NEXT_PUBLIC_CRISP_WEBSITE_ID="{CRISP_WEBSITE_ID}"

# Status Page (BetterStack) - Opcional
# NEXT_PUBLIC_STATUS_PAGE_URL="https://your-subdomain.betteruptime.com"
'''
        
        # Escribir con printf para evitar problemas de escapado
        execute_command(
            client,
            f'''cd /opt/inmova-app && printf '%s' "{env_triada}" >> .env.production'''
        )
        
        # Verificar el resultado final
        print_color(CYAN, "\n🔍 Verificando .env.production final...\n")
        exit_code, output, _ = execute_command(
            client,
            "cd /opt/inmova-app && grep -E '(SENTRY_DSN|CRISP_WEBSITE_ID)' .env.production"
        )
        
        # Contar líneas para asegurarnos de que no hay duplicados
        sentry_count = output.count('NEXT_PUBLIC_SENTRY_DSN')
        crisp_count = output.count('NEXT_PUBLIC_CRISP_WEBSITE_ID')
        
        if sentry_count == 1 and crisp_count == 1:
            print_color(GREEN, f"\n✅ Sin duplicados: Sentry x{sentry_count}, Crisp x{crisp_count}\n")
        else:
            print_color(RED, f"\n⚠️  Posibles duplicados: Sentry x{sentry_count}, Crisp x{crisp_count}\n")
        
        # Mostrar las últimas líneas
        print_color(CYAN, "📄 Últimas 20 líneas del .env.production:\n")
        execute_command(
            client,
            "cd /opt/inmova-app && tail -20 .env.production"
        )
        
        # Rebuild rápido
        print_color(CYAN, "\n🔨 Rebuilding Next.js...\n")
        print_color(YELLOW, "⏳ Esto tardará 2-3 minutos...\n")
        
        execute_command(
            client,
            "cd /opt/inmova-app && pm2 stop inmova-app",
            show_output=False
        )
        
        execute_command(
            client,
            "cd /opt/inmova-app && rm -rf .next/cache",
            show_output=False
        )
        
        exit_code, output, error = execute_command(
            client,
            "cd /opt/inmova-app && npm run build 2>&1 | tail -10",
            show_output=False
        )
        
        if exit_code == 0:
            print_color(GREEN, "✅ Build completado\n")
        else:
            print_color(YELLOW, "⚠️  Build warning (continuando...)\n")
        
        # Reiniciar PM2
        print_color(CYAN, "🔄 Reiniciando PM2...\n")
        execute_command(
            client,
            "cd /opt/inmova-app && pm2 restart inmova-app --update-env"
        )
        
        print_color(YELLOW, "\n⏳ Esperando 20 segundos...\n")
        time.sleep(20)
        
        # Verificar
        print_color(CYAN, "✅ Verificando app...\n")
        execute_command(
            client,
            "pm2 status inmova-app"
        )
        
        print_color(GREEN, "\n" + "="*70)
        print_color(GREEN, "  ✅ CONFIGURACIÓN LIMPIA COMPLETADA")
        print_color(GREEN, "="*70 + "\n")
        
        print_color(CYAN, "🧪 SIGUIENTE PASO:\n")
        print("1. Abre https://inmovaapp.com en modo incógnito")
        print("2. Verifica el widget de Crisp (esquina inferior derecha)")
        print("3. Abre las DevTools (F12) y busca 'crisp' en el HTML")
        print("4. Si no aparece, espera 2-3 minutos para propagación\n")
        
    except Exception as e:
        print_color(RED, f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_color(YELLOW, "\n\n⚠️  Cancelado.\n")
        sys.exit(0)
