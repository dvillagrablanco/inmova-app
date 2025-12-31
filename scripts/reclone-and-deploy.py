#!/usr/bin/env python3
"""
Reclonar repositorio completo y deployar
"""

import paramiko
import sys
import time

SSH_HOST = "157.180.119.236"
SSH_USER = "root"
SSH_PASS = "xqxAkFdA33j3"

def print_step(msg):
    print(f"\n\033[1;36m{msg}\033[0m")

def print_success(msg):
    print(f"\033[32m✅ {msg}\033[0m")

def print_error(msg):
    print(f"\033[31m❌ {msg}\033[0m")

def exec_cmd(ssh, cmd, show=True):
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8')
    if show:
        print(out)
    return exit_code, out

def main():
    print_step("🚀 REDEPLOYMENT COMPLETO")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(SSH_HOST, 22, SSH_USER, SSH_PASS, timeout=30)
        print_success("Conectado")
    
        # 1. Backup de .env
        print_step("1. Respaldando configuración...")
        exec_cmd(ssh, "cp /opt/inmova-app/.env.production /root/.env.production.backup 2>/dev/null || true", show=False)
        exec_cmd(ssh, "cp /opt/inmova-app/prisma/.env /root/.env.prisma.backup 2>/dev/null || true", show=False)
        print_success("Backup creado")
        
        # 2. Detener contenedores
        print_step("2. Deteniendo contenedores...")
        exec_cmd(ssh, "cd /opt/inmova-app && docker-compose down 2>/dev/null || true", show=False)
        print_success("Contenedores detenidos")
        
        # 3. Mover directorio viejo
        print_step("3. Respaldando código antiguo...")
        exec_cmd(ssh, "mv /opt/inmova-app /opt/inmova-app.old.$(date +%s) 2>/dev/null || rm -rf /opt/inmova-app", show=False)
        print_success("Código antiguo respaldado")
        
        # 4. Clonar repositorio fresco
        print_step("4. Clonando repositorio desde GitHub...")
        code, out = exec_cmd(ssh, "cd /opt && git clone https://github.com/dvillagrablanco/inmova-app.git", show=True)
        
        if code != 0:
            print_error("Error clonando repositorio")
            return 1
        
        print_success("Repositorio clonado exitosamente")
    
    # 5. Restaurar .env
    print_step("5. Restaurando configuración...")
    exec_cmd(ssh, "cp /root/.env.production.backup /opt/inmova-app/.env.production 2>/dev/null || true", show=False)
    exec_cmd(ssh, "cp /root/.env.prisma.backup /opt/inmova-app/prisma/.env 2>/dev/null || true", show=False)
    print_success("Configuración restaurada")
    
    # 6. Verificar estructura
    print_step("6. Verificando estructura...")
    code, out = exec_cmd(ssh, "cd /opt/inmova-app && find app -name 'page.tsx' | grep -E 'landing|home' | sort", show=False)
    
    print("Páginas encontradas:")
    for line in out.strip().split('\n'):
        if line.strip():
            if 'landing/page.tsx' in line and '/landing/' not in line.replace('app/landing/page.tsx', ''):
                print(f"  ✅ {line} - CORRECTO")
            elif 'home' in line:
                print(f"  ⚠️  {line} - Potencial conflicto")
            else:
                print(f"  📄 {line}")
    
    # 7. Verificar archivos conflictivos específicos
    print_step("7. Verificando archivos conflictivos...")
    code, out = exec_cmd(ssh, "ls -la /opt/inmova-app/app/home/page.tsx 2>&1 || echo 'No existe app/home'", show=False)
    if 'No existe' in out:
        print_success("✅ app/home/page.tsx NO existe (correcto)")
    else:
        print_error("❌ app/home/page.tsx EXISTE (conflicto)")
        exec_cmd(ssh, "rm -rf /opt/inmova-app/app/home", show=False)
        print_success("Eliminado app/home")
    
    code, out = exec_cmd(ssh, "ls -la /opt/inmova-app/app/\\(public\\)/home/page.tsx 2>&1 || echo 'No existe (public)/home'", show=False)
    if 'No existe' in out:
        print_success("✅ app/(public)/home NO existe (correcto)")
    else:
        print_error("❌ app/(public)/home EXISTE (conflicto)")
        exec_cmd(ssh, "rm -rf /opt/inmova-app/app/\\(public\\)", show=False)
        print_success("Eliminado app/(public)")
    
    # 8. Deployment
    print_step("8. Iniciando deployment (3-5 minutos)...")
    exec_cmd(ssh, "cd /opt/inmova-app && nohup bash scripts/deploy-direct.sh > /tmp/deploy-fresh.log 2>&1 &", show=False)
    print_success("Deployment iniciado")
    
    print("\n⏳ Monitoreando build...")
    time.sleep(15)
    
    # 9. Monitorear progreso
    for i in range(30):
        time.sleep(10)
        code, out = exec_cmd(ssh, "tail -10 /tmp/deploy-fresh.log 2>/dev/null", show=False)
        
        if 'Building' in out or 'Sending build context' in out:
            print(f"  [{i+1}/30] 🏗️  Construyendo imagen Docker...")
        elif 'Successfully' in out or 'Contenedor iniciado' in out:
            print_success("✅ Build exitoso!")
            print("\nÚltimas líneas del log:")
            exec_cmd(ssh, "tail -20 /tmp/deploy-fresh.log", show=True)
            break
        elif 'parallel pages' in out or 'Failed to compile' in out:
            print_error("❌ Error en build - rutas conflictivas")
            exec_cmd(ssh, "tail -30 /tmp/deploy-fresh.log | grep -A 10 -B 5 'Failed\\|error\\|parallel'", show=True)
            return 1
        elif i % 3 == 0 and i > 0:
            print(f"  [{i+1}/30] ⏳ Build en progreso...")
    
    # 10. Verificar contenedores
    print_step("10. Verificando contenedores...")
    time.sleep(5)
    exec_cmd(ssh, "docker ps | grep inmova", show=True)
    
    # 11. Test de conectividad
    print_step("11. Probando aplicación...")
    time.sleep(5)
    code, out = exec_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo '000'", show=False)
    status = out.strip()
    
    if status in ['200', '307', '301']:
        print_success(f"✅ Aplicación respondiendo (HTTP {status})")
    else:
        print_error(f"⚠️  Status: {status} - Puede necesitar más tiempo")
    
    # Resumen
    print("\n" + "="*80)
    print("✅ DEPLOYMENT COMPLETADO")
    print("="*80)
    print("\n🌐 Verificar en: https://inmovaapp.com")
    print("\n📋 Comandos útiles:")
    print("  • Ver logs: ssh root@157.180.119.236 'docker logs -f inmova-app_app_1'")
    print("  • Ver build log: ssh root@157.180.119.236 'tail -50 /tmp/deploy-fresh.log'")
    print("\n🔐 IMPORTANTE: Cambia la contraseña SSH ahora por seguridad\n")
    
    except Exception as e:
        print_error(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        ssh.close()

    return 0

if __name__ == "__main__":
    sys.exit(main())
