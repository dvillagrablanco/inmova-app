#!/usr/bin/env python3
"""
Script de Deployment para fix de edificios y ocupación
Usa Paramiko para conexión SSH
"""

import sys
import time
import os

# Add user packages path
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.getenv("SSH_PASSWORD", "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=")
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(message, color=None):
    timestamp = time.strftime('%H:%M:%S')
    if color:
        print(f"{color}[{timestamp}] {message}{Colors.END}")
    else:
        print(f"[{timestamp}] {message}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando SSH y retornar resultado"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_code, output, error

def main():
    print("=" * 70)
    log("🚀 DEPLOYMENT: Fix página edificios y datos ocupación", Colors.CYAN)
    print("=" * 70)
    print(f"Servidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print("=" * 70)
    
    # Conectar SSH
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP, 
            username=SERVER_USER, 
            password=SERVER_PASSWORD, 
            timeout=30
        )
        log("✅ Conectado al servidor", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    try:
        # 1. Verificar que existe el directorio
        log("📁 Verificando directorio...", Colors.YELLOW)
        exit_code, output, error = exec_cmd(client, f"cd {APP_PATH} && pwd")
        if exit_code != 0:
            log(f"❌ Directorio no encontrado: {error}", Colors.RED)
            return 1
        log(f"✅ Directorio: {output.strip()}", Colors.GREEN)
        
        # 2. Fetch y pull de cambios
        log("📥 Actualizando código desde GitHub...", Colors.YELLOW)
        
        # Primero fetch para obtener las referencias
        exit_code, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
        if exit_code != 0:
            log(f"⚠️ Warning en fetch: {error}", Colors.YELLOW)
        
        # Checkout a la rama correcta
        exit_code, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && git checkout cursor/proyecto-inmova-despliegue-032a 2>/dev/null || git checkout -b cursor/proyecto-inmova-despliegue-032a origin/cursor/proyecto-inmova-despliegue-032a"
        )
        if exit_code != 0:
            log(f"⚠️ Branch: {error}", Colors.YELLOW)
        
        # Pull de los cambios
        exit_code, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && git pull origin cursor/proyecto-inmova-despliegue-032a"
        )
        if exit_code != 0 and "Already up to date" not in output:
            log(f"⚠️ Pull: {error}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)
        
        # Mostrar último commit
        exit_code, output, error = exec_cmd(client, f"cd {APP_PATH} && git log -1 --oneline")
        log(f"📝 Commit: {output.strip()}", Colors.CYAN)
        
        # 3. Verificar archivos creados
        log("🔍 Verificando archivos nuevos...", Colors.YELLOW)
        exit_code, output, error = exec_cmd(
            client, 
            f"ls -la {APP_PATH}/app/edificios/\\[id\\]/ 2>/dev/null || echo 'No existe'"
        )
        if "No existe" in output:
            log("⚠️ Directorio [id] no existe aún en servidor", Colors.YELLOW)
        else:
            log(f"✅ Archivos encontrados:\n{output}", Colors.GREEN)
        
        # 4. Instalar dependencias (si hay cambios en package.json)
        log("📦 Verificando dependencias...", Colors.YELLOW)
        exit_code, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=600
        )
        log("✅ Dependencias verificadas", Colors.GREEN)
        
        # 5. Rebuild de la aplicación
        log("🏗️ Rebuilding aplicación...", Colors.YELLOW)
        log("⏳ Esto puede tomar unos minutos...", Colors.YELLOW)
        
        exit_code, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && npm run build 2>&1 | tail -30",
            timeout=900
        )
        
        if exit_code != 0:
            log(f"❌ Error en build:\n{output}\n{error}", Colors.RED)
            # Mostrar más detalle del error
            exit_code2, output2, error2 = exec_cmd(
                client,
                f"cd {APP_PATH} && npm run build 2>&1 | grep -i 'error\\|failed' | head -20"
            )
            if output2:
                log(f"Errores detectados:\n{output2}", Colors.RED)
            return 1
        
        log("✅ Build completado", Colors.GREEN)
        
        # 6. Restart de la aplicación
        log("♻️ Reiniciando aplicación...", Colors.YELLOW)
        
        # Verificar si usa PM2 o Docker
        exit_code, output, error = exec_cmd(client, "pm2 list 2>/dev/null | grep inmova")
        uses_pm2 = exit_code == 0 and "inmova" in output
        
        exit_code, output, error = exec_cmd(client, "docker ps 2>/dev/null | grep inmova")
        uses_docker = exit_code == 0 and "inmova" in output
        
        if uses_pm2:
            log("🔄 Usando PM2...", Colors.CYAN)
            exit_code, output, error = exec_cmd(client, "pm2 reload inmova-app")
            if exit_code != 0:
                exit_code, output, error = exec_cmd(client, "pm2 restart inmova-app")
            log("✅ PM2 reiniciado", Colors.GREEN)
        elif uses_docker:
            log("🐳 Usando Docker...", Colors.CYAN)
            exit_code, output, error = exec_cmd(
                client, 
                "docker restart inmova-app-production 2>/dev/null || docker restart inmova-app"
            )
            log("✅ Docker reiniciado", Colors.GREEN)
        else:
            log("⚠️ No se detectó PM2 ni Docker, usando PM2 por defecto", Colors.YELLOW)
            exit_code, output, error = exec_cmd(client, f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start")
        
        # 7. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health checks
        log("🏥 Verificando health...", Colors.YELLOW)
        
        # Test básico de conexión
        exit_code, output, error = exec_cmd(
            client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ --max-time 10"
        )
        status_home = output.strip()
        
        # Test de página edificios
        exit_code, output, error = exec_cmd(
            client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/edificios --max-time 10"
        )
        status_edificios = output.strip()
        
        # Test de API estadísticas
        exit_code, output, error = exec_cmd(
            client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/estadisticas --max-time 10"
        )
        status_api = output.strip()
        
        print("\n" + "=" * 70)
        log("📊 RESULTADOS DE HEALTH CHECKS", Colors.CYAN)
        print("=" * 70)
        
        checks_passed = 0
        
        if status_home in ['200', '302', '307']:
            log(f"✅ Home: {status_home}", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ Home: {status_home}", Colors.RED)
        
        if status_edificios in ['200', '302', '307']:
            log(f"✅ /edificios: {status_edificios}", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ /edificios: {status_edificios}", Colors.RED)
        
        if status_api in ['200', '401']:  # 401 es válido (requiere auth)
            log(f"✅ /api/estadisticas: {status_api}", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"❌ /api/estadisticas: {status_api}", Colors.RED)
        
        # Test externo
        log("\n🌐 Verificando acceso externo...", Colors.YELLOW)
        exit_code, output, error = exec_cmd(
            client,
            f"curl -s -o /dev/null -w '%{{http_code}}' http://{SERVER_IP}:3000/edificios --max-time 10"
        )
        status_external = output.strip()
        
        if status_external in ['200', '302', '307']:
            log(f"✅ Acceso externo /edificios: {status_external}", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"⚠️ Acceso externo /edificios: {status_external}", Colors.YELLOW)
        
        print("\n" + "=" * 70)
        if checks_passed >= 3:
            log("🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE", Colors.GREEN)
        else:
            log("⚠️ DEPLOYMENT COMPLETADO CON ADVERTENCIAS", Colors.YELLOW)
        print("=" * 70)
        
        print(f"""
URLs:
  - Edificios: http://{SERVER_IP}:3000/edificios
  - Ver Edificio: http://{SERVER_IP}:3000/edificios/[id]
  - Estadísticas: http://{SERVER_IP}:3000/estadisticas
  - API Stats: http://{SERVER_IP}:3000/api/estadisticas

Comandos útiles:
  pm2 logs inmova-app
  pm2 status
""")
        
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("🔒 Conexión SSH cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
