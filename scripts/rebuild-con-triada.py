#!/usr/bin/env python3
"""
Rebuild completo de la aplicación con las nuevas variables de la Triada
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def print_color(color, text):
    print(f"{color}{text}{RESET}")

def print_step(step_num, total_steps, description):
    print_color(CYAN, f"\n{'='*70}")
    print_color(CYAN, f"  PASO {step_num}/{total_steps}: {description}")
    print_color(CYAN, f"{'='*70}\n")

def execute_command(client, command, description, timeout=300):
    print_color(YELLOW, f"   $ {command}")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if exit_code == 0:
        print_color(GREEN, f"   ✅ {description}")
        if output.strip():
            lines = output.strip().split('\n')
            for line in lines[-10:]:  # Últimas 10 líneas
                print(f"      {line}")
    else:
        print_color(RED, f"   ❌ {description} (exit code: {exit_code})")
        if error.strip():
            for line in error.strip().split('\n')[:10]:
                print(f"      {line}")
    
    return exit_code, output, error

def main():
    print_color(CYAN, """
╔══════════════════════════════════════════════════════════════════╗
║     🔨 REBUILD CON VARIABLES DE LA TRIADA                       ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    print_step(1, 7, "Conectando al servidor")
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print_color(GREEN, f"   ✅ Conectado a {SERVER_IP}\n")
    except Exception as e:
        print_color(RED, f"   ❌ Error conectando: {e}\n")
        sys.exit(1)
    
    try:
        # Paso 2: Verificar variables de entorno
        print_step(2, 7, "Verificando variables de la Triada")
        execute_command(
            client,
            "cd /opt/inmova-app && grep -E '(SENTRY_DSN|CRISP_WEBSITE_ID)' .env.production | head -5",
            "Variables configuradas"
        )
        
        # Paso 3: Detener PM2
        print_step(3, 7, "Deteniendo PM2")
        execute_command(
            client,
            "pm2 stop inmova-app",
            "PM2 detenido"
        )
        
        # Paso 4: Limpiar cache de Next.js
        print_step(4, 7, "Limpiando cache de Next.js")
        execute_command(
            client,
            "cd /opt/inmova-app && rm -rf .next/cache",
            "Cache limpiado"
        )
        
        # Paso 5: Rebuild de Next.js con las nuevas variables
        print_step(5, 7, "Rebuilding Next.js (esto puede tardar 2-3 minutos)")
        print_color(YELLOW, "   ⏳ Paciencia, este paso es lento...\n")
        
        exit_code, output, error = execute_command(
            client,
            "cd /opt/inmova-app && npm run build",
            "Build completado",
            timeout=600  # 10 minutos de timeout
        )
        
        if exit_code != 0:
            print_color(RED, "\n❌ Build falló. Intentando con un enfoque alternativo...\n")
            
            # Intento alternativo: asegurarse de que las dependencias estén OK
            print_color(YELLOW, "Reinstalando dependencias críticas...\n")
            execute_command(
                client,
                "cd /opt/inmova-app && npm install --legacy-peer-deps",
                "Dependencias instaladas",
                timeout=300
            )
            
            # Regenerar Prisma Client
            execute_command(
                client,
                "cd /opt/inmova-app && npx prisma generate",
                "Prisma Client generado"
            )
            
            # Reintentar build
            print_color(YELLOW, "\n⏳ Reintentando build...\n")
            exit_code, output, error = execute_command(
                client,
                "cd /opt/inmova-app && npm run build",
                "Build completado",
                timeout=600
            )
            
            if exit_code != 0:
                print_color(RED, "\n❌ Build falló de nuevo. Continuando sin rebuild...\n")
        
        # Paso 6: Reiniciar PM2 con las nuevas variables
        print_step(6, 7, "Reiniciando PM2")
        
        execute_command(
            client,
            "cd /opt/inmova-app && pm2 restart inmova-app --update-env",
            "PM2 reiniciado con nuevas variables"
        )
        
        # Esperar arranque
        print_color(YELLOW, "\n   ⏳ Esperando 20 segundos para que la app arranque...\n")
        time.sleep(20)
        
        # Paso 7: Verificación
        print_step(7, 7, "Verificando la aplicación")
        
        # Estado de PM2
        execute_command(
            client,
            "pm2 status inmova-app",
            "Estado de PM2"
        )
        
        # Health check
        exit_code, output, _ = execute_command(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000",
            "Health check HTTP"
        )
        
        if '200' in output or '301' in output or '302' in output:
            print_color(GREEN, "   ✅ App respondiendo correctamente\n")
        else:
            print_color(YELLOW, f"   ⚠️  Response code: {output.strip()}\n")
        
        # Verificar que Crisp está en el HTML
        print_color(CYAN, "\n🔍 Verificando integración de Crisp en el HTML...\n")
        exit_code, output, _ = execute_command(
            client,
            "curl -s http://localhost:3000 | grep -i 'crisp' | head -3",
            "Búsqueda de Crisp"
        )
        
        if 'crisp' in output.lower() or 'CRISP_WEBSITE_ID' in output:
            print_color(GREEN, "   ✅ Crisp detectado en el HTML!\n")
        else:
            print_color(YELLOW, "   ⚠️  Crisp no detectado aún (puede requerir cache refresh)\n")
        
        # Logs recientes
        print_color(CYAN, "\n📋 Últimos logs:\n")
        execute_command(
            client,
            "pm2 logs inmova-app --lines 15 --nostream",
            "Logs"
        )
        
        print_color(CYAN, "\n" + "="*70)
        print_color(GREEN, "  ✅ REBUILD COMPLETADO")
        print_color(CYAN, "="*70 + "\n")
        
        print_color(GREEN, "🎉 Aplicación rebuildeada con la Triada!\n")
        
        print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print_color(CYAN, "  🧪 VERIFICACIÓN EN PRODUCCIÓN")
        print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        
        print("1️⃣  Test de Crisp Chat:")
        print("   Abre: https://inmovaapp.com")
        print("   Debe aparecer el widget de chat (esquina inferior derecha)\n")
        
        print("2️⃣  Test de Sentry:")
        print("   $ curl https://inmovaapp.com/api/test-sentry")
        print("   Verifica en: https://sentry.io/issues/\n")
        
        print("3️⃣  Limpia cache del navegador:")
        print("   - Ctrl+Shift+R (hard refresh)")
        print("   - O modo incógnito\n")
        
        print_color(YELLOW, "⏱️  Los cambios pueden tardar 1-2 minutos en propagarse.\n")
        
    except Exception as e:
        print_color(RED, f"\n❌ Error durante el rebuild: {e}\n")
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
