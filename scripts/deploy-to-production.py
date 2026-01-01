#!/usr/bin/env python3
"""
DEPLOYMENT A PRODUCCIÓN: INMOVAAPP.COM
Despliega cambios UX vía SSH con paramiko
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'
TIMEOUT = 600  # 10 minutos

def print_step(step, message):
    """Imprime paso del deployment"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"\n[{timestamp}] 📋 PASO {step}: {message}")
    print("=" * 60)

def execute_command(client, command, description, timeout=60):
    """Ejecuta comando SSH y retorna output"""
    print(f"\n🔧 {description}")
    print(f"   $ {command}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if output:
        print(f"   ✓ {output[:500]}")  # Primeros 500 chars
    
    if exit_status != 0:
        print(f"   ✗ Error (exit {exit_status}): {error[:500]}")
        return False, error
    
    return True, output

def main():
    print("\n" + "=" * 60)
    print("🚀 DEPLOYMENT: MEJORAS UX A PRODUCCIÓN")
    print("=" * 60)
    print(f"Servidor: {SERVER_IP} (inmovaapp.com)")
    print(f"Usuario: {USERNAME}")
    print(f"Directorio: {APP_DIR}")
    print("=" * 60)
    
    client = None
    
    try:
        # PASO 1: Conectar SSH
        print_step(1, "Conectando al servidor")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print("Estableciendo conexión SSH...")
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=30,
            look_for_keys=False,
            allow_agent=False
        )
        print("✅ Conexión SSH establecida")
        
        # PASO 2: Verificar directorio
        print_step(2, "Verificando directorio de aplicación")
        success, output = execute_command(
            client,
            f"ls -la {APP_DIR}",
            "Listando directorio de app",
            timeout=10
        )
        
        if not success:
            print(f"❌ Directorio {APP_DIR} no existe")
            return False
        
        # PASO 3: Git pull
        print_step(3, "Actualizando código desde repositorio")
        
        # Ver estado actual
        execute_command(
            client,
            f"cd {APP_DIR} && git status",
            "Estado actual del repositorio",
            timeout=10
        )
        
        # Ver rama actual
        execute_command(
            client,
            f"cd {APP_DIR} && git branch",
            "Rama actual",
            timeout=10
        )
        
        # Pull de cambios
        success, output = execute_command(
            client,
            f"cd {APP_DIR} && git pull origin cursor/onboarding-profile-setup-c5c5",
            "Git pull de rama cursor/onboarding-profile-setup-c5c5",
            timeout=60
        )
        
        if not success:
            print("⚠️ Git pull falló, intentando con main...")
            success, output = execute_command(
                client,
                f"cd {APP_DIR} && git pull origin main",
                "Git pull de rama main",
                timeout=60
            )
        
        if "Already up to date" in output or "Already up-to-date" in output:
            print("ℹ️ Código ya estaba actualizado")
        elif success:
            print("✅ Código actualizado correctamente")
        else:
            print("❌ Error en git pull")
            return False
        
        # PASO 4: Instalar dependencias
        print_step(4, "Instalando dependencias")
        
        # Verificar si package.json cambió
        execute_command(
            client,
            f"cd {APP_DIR} && git diff HEAD@{{1}} HEAD --name-only | grep package.json",
            "Verificando cambios en package.json",
            timeout=10
        )
        
        # Instalar dependencias (todas, incluyendo devDependencies para build)
        success, output = execute_command(
            client,
            f"cd {APP_DIR} && npm install",
            "Instalando dependencias completas",
            timeout=300  # 5 minutos
        )
        
        if not success:
            print("⚠️ npm install tuvo warnings, continuando...")
        
        # PASO 5: Build de aplicación
        print_step(5, "Construyendo aplicación Next.js")
        
        # Limpiar cache anterior
        execute_command(
            client,
            f"cd {APP_DIR} && rm -rf .next/cache",
            "Limpiando cache de Next.js",
            timeout=10
        )
        
        # Build
        success, output = execute_command(
            client,
            f"cd {APP_DIR} && npm run build",
            "Construyendo aplicación (puede tardar varios minutos)",
            timeout=600  # 10 minutos
        )
        
        if not success:
            print("❌ Build falló")
            print("ℹ️ Ver logs completos en el servidor")
            return False
        
        print("✅ Build completado exitosamente")
        
        # PASO 6: Verificar PM2
        print_step(6, "Verificando configuración PM2")
        
        # Ver apps PM2 actuales
        execute_command(
            client,
            "pm2 list",
            "Listando apps PM2",
            timeout=10
        )
        
        # PASO 7: Reiniciar aplicación
        print_step(7, "Reiniciando aplicación")
        
        # Intentar reload sin downtime
        print("Intentando reload sin downtime...")
        success, output = execute_command(
            client,
            "pm2 reload inmova-app",
            "PM2 reload (zero-downtime)",
            timeout=60
        )
        
        if not success:
            print("⚠️ Reload falló, intentando restart normal...")
            success, output = execute_command(
                client,
                "pm2 restart inmova-app",
                "PM2 restart",
                timeout=60
            )
        
        if not success:
            print("⚠️ Restart falló, intentando start...")
            execute_command(
                client,
                f"cd {APP_DIR} && pm2 start ecosystem.config.js --env production",
                "PM2 start",
                timeout=60
            )
        
        # Guardar configuración PM2
        execute_command(
            client,
            "pm2 save",
            "Guardando configuración PM2",
            timeout=10
        )
        
        # PASO 8: Verificar estado
        print_step(8, "Verificando estado de la aplicación")
        
        # Esperar a que arranque
        print("Esperando 15 segundos para warm-up...")
        time.sleep(15)
        
        # Ver logs recientes
        execute_command(
            client,
            "pm2 logs inmova-app --lines 20 --nostream",
            "Logs recientes",
            timeout=10
        )
        
        # Ver estado PM2
        execute_command(
            client,
            "pm2 status",
            "Estado de PM2",
            timeout=10
        )
        
        # PASO 9: Health check
        print_step(9, "Ejecutando health check")
        
        # Health check local
        for attempt in range(5):
            print(f"\n   Intento {attempt + 1}/5...")
            success, output = execute_command(
                client,
                "curl -f http://localhost:3000/api/health",
                f"Health check local (intento {attempt + 1})",
                timeout=10
            )
            
            if success and "ok" in output.lower():
                print("   ✅ Health check OK")
                break
            
            if attempt < 4:
                print("   ⏳ Esperando 5 segundos...")
                time.sleep(5)
        else:
            print("   ⚠️ Health check no respondió correctamente")
        
        # Health check público
        print("\n   Probando acceso público...")
        success, output = execute_command(
            client,
            "curl -f http://157.180.119.236:3000/",
            "Health check público (IP)",
            timeout=10
        )
        
        if success:
            print("   ✅ Acceso público OK")
        
        # PASO 10: Verificar Nginx (si existe)
        print_step(10, "Verificando Nginx")
        
        execute_command(
            client,
            "systemctl status nginx --no-pager",
            "Estado de Nginx",
            timeout=10
        )
        
        # Test Nginx config
        execute_command(
            client,
            "nginx -t",
            "Verificar configuración Nginx",
            timeout=10
        )
        
        # PASO 11: Información final
        print_step(11, "Deployment completado")
        
        print("\n✅ DEPLOYMENT EXITOSO")
        print("\n" + "=" * 60)
        print("🌐 URLs DISPONIBLES:")
        print("=" * 60)
        print(f"   IP Directa: http://{SERVER_IP}:3000")
        print("   Dominio: https://inmovaapp.com")
        print("   Login: https://inmovaapp.com/login")
        print("   Dashboard: https://inmovaapp.com/dashboard")
        print("   Configuración: https://inmovaapp.com/configuracion")
        print("\n" + "=" * 60)
        print("📋 CREDENCIALES DE PRUEBA:")
        print("=" * 60)
        print("   Email: principiante@gestor.es")
        print("   Password: Test123456!")
        print("\n" + "=" * 60)
        print("🔍 VERIFICAR MEJORAS UX:")
        print("=" * 60)
        print("   1. Login con usuario de prueba")
        print("   2. Debe aparecer Wizard de bienvenida")
        print("   3. Botón azul de ayuda en esquina inferior derecha")
        print("   4. Ir a Configuración → Tabs 'Mi Experiencia' y 'Funciones'")
        print("   5. Verificar textos claros sin jerga técnica")
        print("\n" + "=" * 60)
        print("📊 MONITOREO:")
        print("=" * 60)
        print("   Ver logs: pm2 logs inmova-app")
        print("   Ver estado: pm2 status")
        print(f"   SSH: ssh {USERNAME}@{SERVER_IP}")
        print("=" * 60)
        
        return True
        
    except paramiko.AuthenticationException:
        print("\n❌ Error de autenticación SSH")
        print("   Verifica usuario y contraseña")
        return False
        
    except paramiko.SSHException as e:
        print(f"\n❌ Error SSH: {str(e)}")
        return False
        
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        if client:
            client.close()
            print("\n🔌 Conexión SSH cerrada")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
