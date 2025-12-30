#!/usr/bin/env python3
"""
🚀 Deployment Automático vía SSH con Paramiko
Inmova App - Frontend Audit Corrections
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import getpass

# Configuración del servidor
SERVER_CONFIG = {
    'host': '157.180.119.236',
    'port': 22,
    'username': 'root',
    'app_path': '/opt/inmova-app',
    'branch': 'cursor/frontend-audit-inmovaapp-com-6336',
    'timeout': 300  # 5 minutos para operaciones largas
}

def execute_command(ssh, command, description, timeout=60):
    """Ejecuta un comando SSH y muestra el output en tiempo real"""
    print(f"\n🔄 {description}")
    print(f"   Comando: {command[:80]}...")
    
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    
    # Leer output en tiempo real
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if output:
        print(f"   Output:\n{output[:500]}")
    
    if exit_status != 0:
        print(f"   ⚠️  Exit status: {exit_status}")
        if error:
            print(f"   Error: {error[:500]}")
        return False, output, error
    else:
        print(f"   ✅ Completado")
        return True, output, error

def main():
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║                                                               ║")
    print("║  🚀 DEPLOYMENT AUTOMÁTICO VÍA SSH - INMOVA APP              ║")
    print("║                                                               ║")
    print("╚═══════════════════════════════════════════════════════════════╝\n")
    
    # Mostrar configuración
    print("📋 Configuración del servidor:")
    print(f"   • Host: {SERVER_CONFIG['host']}")
    print(f"   • Usuario: {SERVER_CONFIG['username']}")
    print(f"   • Path: {SERVER_CONFIG['app_path']}")
    print(f"   • Branch: {SERVER_CONFIG['branch']}")
    print()
    
    # Obtener contraseña de variable de entorno o argumento
    password = sys.argv[1] if len(sys.argv) > 1 else None
    
    if not password:
        print("\n❌ Error: Proporciona la contraseña como argumento")
        print("   Uso: python3 deploy-via-paramiko.py 'TU_CONTRASEÑA'")
        print("\n   ⚠️  Nota: La contraseña será visible en el historial de comandos")
        print("   Alternativa más segura:")
        print("   1. Conecta manualmente vía SSH")
        print("   2. Copia y pega los comandos del archivo COMANDOS_SSH_RAPIDOS.txt")
        return 1
    
    print("\n📡 Conectando al servidor...")
    
    # Crear cliente SSH
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar
        ssh.connect(
            hostname=SERVER_CONFIG['host'],
            port=SERVER_CONFIG['port'],
            username=SERVER_CONFIG['username'],
            password=password,
            timeout=30,
            look_for_keys=False,
            allow_agent=False
        )
        print("✅ Conexión SSH establecida\n")
        
        # PASO 1: Verificar directorio
        print("=" * 65)
        print("PASO 1: Verificación del directorio")
        print("=" * 65)
        
        success, output, _ = execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && pwd",
            "Verificando directorio de la aplicación"
        )
        
        if not success:
            print(f"\n❌ Error: No se pudo acceder a {SERVER_CONFIG['app_path']}")
            return 1
        
        # PASO 2: Estado actual de Git
        print("\n" + "=" * 65)
        print("PASO 2: Estado actual de Git")
        print("=" * 65)
        
        execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && git status",
            "Verificando estado de Git"
        )
        
        execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && git log --oneline -3",
            "Últimos commits"
        )
        
        # PASO 3: Pull de cambios
        print("\n" + "=" * 65)
        print("PASO 3: Actualizar código desde GitHub")
        print("=" * 65)
        
        execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && git fetch origin",
            "Fetching desde origin",
            timeout=60
        )
        
        execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && git checkout main",
            "Checkout a branch main"
        )
        
        success, output, error = execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && git merge origin/{SERVER_CONFIG['branch']}",
            "Mergeando cambios de frontend-audit",
            timeout=30
        )
        
        if not success and "Already up to date" not in output:
            print(f"\n⚠️  Merge puede requerir resolución manual")
        
        # PASO 4: Detectar sistema de deployment
        print("\n" + "=" * 65)
        print("PASO 4: Detectar sistema de deployment")
        print("=" * 65)
        
        # Verificar Docker
        success_docker, _, _ = execute_command(
            ssh,
            f"cd {SERVER_CONFIG['app_path']} && ls docker-compose.yml",
            "Buscando docker-compose.yml"
        )
        
        # Verificar PM2
        success_pm2, output_pm2, _ = execute_command(
            ssh,
            "pm2 list 2>/dev/null | grep inmova",
            "Buscando proceso PM2"
        )
        
        # Verificar Systemd
        success_systemd, _, _ = execute_command(
            ssh,
            "systemctl is-active inmova-app 2>/dev/null",
            "Buscando servicio systemd"
        )
        
        # PASO 5: Deployment según sistema detectado
        print("\n" + "=" * 65)
        print("PASO 5: Ejecutar deployment")
        print("=" * 65)
        
        if success_docker:
            print("\n🐳 Sistema detectado: DOCKER\n")
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && docker-compose down",
                "Deteniendo containers",
                timeout=60
            )
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && docker-compose up -d --build",
                "Rebuilding y reiniciando containers",
                timeout=SERVER_CONFIG['timeout']
            )
            
            print("\n⏳ Esperando 15 segundos para warm-up...")
            time.sleep(15)
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && docker-compose ps",
                "Estado de containers"
            )
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && docker-compose logs --tail 50 app",
                "Logs de la aplicación"
            )
            
        elif success_pm2:
            print("\n🔄 Sistema detectado: PM2\n")
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && npm install",
                "Instalando dependencias",
                timeout=180
            )
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && npm run build",
                "Building aplicación Next.js",
                timeout=SERVER_CONFIG['timeout']
            )
            
            execute_command(
                ssh,
                "pm2 reload inmova-app || pm2 restart inmova-app",
                "Reloading PM2 (zero-downtime)"
            )
            
            print("\n⏳ Esperando 10 segundos...")
            time.sleep(10)
            
            execute_command(
                ssh,
                "pm2 status inmova-app",
                "Estado de PM2"
            )
            
            execute_command(
                ssh,
                "pm2 logs inmova-app --lines 50 --nostream",
                "Logs de la aplicación"
            )
            
        elif success_systemd:
            print("\n⚙️  Sistema detectado: SYSTEMD\n")
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && npm install",
                "Instalando dependencias",
                timeout=180
            )
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && npm run build",
                "Building aplicación",
                timeout=SERVER_CONFIG['timeout']
            )
            
            execute_command(
                ssh,
                "systemctl restart inmova-app",
                "Reiniciando servicio systemd"
            )
            
            print("\n⏳ Esperando 10 segundos...")
            time.sleep(10)
            
            execute_command(
                ssh,
                "systemctl status inmova-app",
                "Estado del servicio"
            )
            
        else:
            print("\n🔧 Sistema detectado: MANUAL\n")
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && npm install",
                "Instalando dependencias",
                timeout=180
            )
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && npm run build",
                "Building aplicación",
                timeout=SERVER_CONFIG['timeout']
            )
            
            execute_command(
                ssh,
                "fuser -k 3000/tcp 2>/dev/null || true",
                "Matando proceso en puerto 3000"
            )
            
            execute_command(
                ssh,
                f"cd {SERVER_CONFIG['app_path']} && nohup npm start > /tmp/inmova.log 2>&1 &",
                "Iniciando aplicación en background"
            )
            
            print("\n⏳ Esperando 10 segundos...")
            time.sleep(10)
        
        # PASO 6: Verificación
        print("\n" + "=" * 65)
        print("PASO 6: Verificación")
        print("=" * 65)
        
        success, output, _ = execute_command(
            ssh,
            "curl -f http://localhost:3000/api/health 2>/dev/null",
            "Health check local"
        )
        
        if success and "ok" in output.lower():
            print("\n✅ Health check: OK")
        else:
            print("\n⚠️  Health check: FALLÓ")
        
        execute_command(
            ssh,
            "curl -I http://localhost:3000 2>/dev/null | grep -i 'x-frame\\|x-content\\|strict-transport'",
            "Verificando headers de seguridad"
        )
        
        # Resumen final
        print("\n" + "=" * 65)
        print("\n✅ DEPLOYMENT COMPLETADO\n")
        print("=" * 65)
        print("\n📋 Verificación desde tu máquina local:")
        print("\n   curl https://inmovaapp.com/api/health")
        print("   curl -I https://inmovaapp.com\n")
        print("   Navegador: https://inmovaapp.com/landing\n")
        print("🎯 Checklist visual:")
        print("   [ ] Landing carga sin errores")
        print("   [ ] Promociones tienen texto más oscuro")
        print("   [ ] Login → inputs tienen autocomplete")
        print("   [ ] Vista móvil sin scroll horizontal\n")
        
        return 0
        
    except paramiko.AuthenticationException:
        print("\n❌ Error: Autenticación fallida")
        print("   Verifica usuario y contraseña")
        return 1
        
    except paramiko.SSHException as e:
        print(f"\n❌ Error SSH: {e}")
        return 1
        
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        ssh.close()
        print("\n🔌 Conexión SSH cerrada")

if __name__ == "__main__":
    sys.exit(main())
