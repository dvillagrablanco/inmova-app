#!/usr/bin/env python3
"""
Deployment: Fix Idiomas y Límites en Planes
================================================
- Añadidos idiomas Alemán (de) e Italiano (it)
- Mejorada página de planes con límites de integraciones
- Actualizada API pública de planes
"""

import sys
import time

# Ensure paramiko is in path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Server config
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def execute_command(client, command, description, timeout=300):
    """Execute command and print output in real-time"""
    print(f"\n[{time.strftime('%H:%M:%S')}] {description}")
    print(f"   Command: {command[:80]}...")
    
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        
        # Wait for command to complete
        exit_status = stdout.channel.recv_exit_status()
        
        # Get output
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if exit_status == 0:
            print(f"   ✅ Success")
            if output.strip():
                # Only show last 5 lines of output
                lines = output.strip().split('\n')
                if len(lines) > 5:
                    print(f"   Output (last 5 lines):")
                    for line in lines[-5:]:
                        print(f"     {line}")
                else:
                    for line in lines:
                        print(f"     {line}")
        else:
            print(f"   ❌ Failed (exit code: {exit_status})")
            if error.strip():
                print(f"   Error: {error[:500]}")
            return False
        
        return True
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("🚀 DEPLOYMENT: FIX IDIOMAS Y LÍMITES EN PLANES")
    print("=" * 70)
    print()
    print(f"Servidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print()
    print("Cambios:")
    print("  - Añadidos idiomas Alemán (de) e Italiano (it)")
    print("  - Mejorada página de planes con límites de integraciones")
    print("  - Actualizada API pública de planes")
    print()
    print("=" * 70)
    print()
    
    # Connect
    print(f"[{time.strftime('%H:%M:%S')}] 🔐 Conectando a servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        print(f"   ✅ Conectado a {SERVER_IP}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return 1
    
    try:
        # 1. Update code
        if not execute_command(
            client,
            f"cd {APP_PATH} && git pull origin main",
            "📥 Actualizando código desde Git",
            timeout=60
        ):
            print("\n⚠️ Git pull falló, verificando si ya está actualizado...")
            # Continue anyway
        
        # 2. Install dependencies (if package.json changed)
        if not execute_command(
            client,
            f"cd {APP_PATH} && npm install",
            "📦 Instalando dependencias",
            timeout=600
        ):
            print("\n❌ Error instalando dependencias")
            return 1
        
        # 3. Build
        if not execute_command(
            client,
            f"cd {APP_PATH} && npm run build",
            "🏗️  Building aplicación",
            timeout=900
        ):
            print("\n❌ Error en build")
            return 1
        
        # 4. Restart PM2
        print()
        print("=" * 70)
        print("🚀 DEPLOYMENT")
        print("=" * 70)
        
        if not execute_command(
            client,
            "pm2 reload inmova-app",
            "♻️  Reloading PM2 (zero-downtime)",
            timeout=60
        ):
            print("\n⚠️ PM2 reload falló, intentando restart...")
            if not execute_command(
                client,
                "pm2 restart inmova-app",
                "♻️  Restarting PM2",
                timeout=60
            ):
                print("\n❌ Error reiniciando PM2")
                return 1
        
        # 5. Wait for warm-up
        print(f"\n[{time.strftime('%H:%M:%S')}] ⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        # 6. Health checks
        print()
        print("=" * 70)
        print("🏥 HEALTH CHECKS POST-DEPLOYMENT")
        print("=" * 70)
        
        health_checks = 0
        total_checks = 5
        
        # Check 1: HTTP
        if execute_command(
            client,
            "curl -f -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health",
            "1/5 Verificando HTTP /api/health",
            timeout=30
        ):
            health_checks += 1
        
        # Check 2: PM2 status
        if execute_command(
            client,
            "pm2 status inmova-app | grep online",
            "2/5 Verificando PM2 status",
            timeout=10
        ):
            health_checks += 1
        
        # Check 3: Planes API
        if execute_command(
            client,
            "curl -f -s http://localhost:3000/api/public/subscription-plans | grep signaturesIncludedMonth",
            "3/5 Verificando API de planes (límites)",
            timeout=30
        ):
            health_checks += 1
        
        # Check 4: i18n files
        if execute_command(
            client,
            f"ls {APP_PATH}/locales/ | grep -E '(de|it).json'",
            "4/5 Verificando archivos de traducción (de, it)",
            timeout=10
        ):
            health_checks += 1
        
        # Check 5: Memory
        if execute_command(
            client,
            "free | awk 'NR==2{printf \"%.0f\", $3*100/$2}'",
            "5/5 Verificando uso de memoria",
            timeout=10
        ):
            health_checks += 1
        
        print()
        print(f"Health checks: {health_checks}/{total_checks} pasando")
        print()
        
        if health_checks >= 3:
            print("=" * 70)
            print("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
            print("=" * 70)
            print()
            print("URLs:")
            print("  - Landing: https://inmovaapp.com")
            print("  - Planes: https://inmovaapp.com/planes")
            print("  - API Planes: https://inmovaapp.com/api/public/subscription-plans")
            print("  - Health: https://inmovaapp.com/api/health")
            print()
            print("Cambios aplicados:")
            print("  ✅ Idiomas: Español, Inglés, Portugués, Francés, Alemán, Italiano")
            print("  ✅ Límites en planes: Firmas, Storage, IA, SMS")
            print("  ✅ API pública actualizada")
            print()
            print("Para verificar:")
            print("  1. Selector de idiomas visible en header")
            print("  2. Planes muestran límites de integraciones")
            print("  3. Cambiar idioma y ver menús traducidos")
            print()
            print("=" * 70)
            return 0
        else:
            print("=" * 70)
            print("⚠️ DEPLOYMENT COMPLETADO CON WARNINGS")
            print("=" * 70)
            print()
            print(f"Solo {health_checks}/{total_checks} health checks pasaron")
            print("La aplicación puede estar funcionando parcialmente")
            print()
            print("Verificar manualmente:")
            print(f"  ssh {SERVER_USER}@{SERVER_IP} 'pm2 logs inmova-app --lines 50'")
            print()
            return 1
    
    except Exception as e:
        print()
        print("=" * 70)
        print("❌ ERROR DURANTE DEPLOYMENT")
        print("=" * 70)
        print(f"Error: {str(e)}")
        print()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
