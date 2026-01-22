#!/usr/bin/env python3
"""
Deployment SSH con Paramiko - Rescate Inmova App
Fecha: 22 Enero 2026
"""

import sys
import time
import paramiko
from datetime import datetime

# ============================================
# CONFIGURACIÓN
# ============================================
SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
REMOTE_PATH = "/opt/inmova-app"
GIT_BRANCH = "main"

# Colores
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.NC):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.NC}")

def log_success(msg): log(f"✅ {msg}", Colors.GREEN)
def log_error(msg): log(f"❌ {msg}", Colors.RED)
def log_warning(msg): log(f"⚠️  {msg}", Colors.YELLOW)
def log_info(msg): log(f"ℹ️  {msg}", Colors.BLUE)
def log_step(step, msg): print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}\n{step} {msg}\n{'='*60}{Colors.NC}")

def exec_cmd(client, cmd, timeout=300, show_output=True):
    """Ejecutar comando SSH y retornar resultado"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        
        if show_output and output.strip():
            for line in output.strip().split('\n')[:50]:  # Limitar output
                print(f"    {line}")
        
        return exit_code, output, error
    except Exception as e:
        return -1, "", str(e)

def main():
    print(f"""
{Colors.CYAN}╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  🚀 DEPLOYMENT SSH - RESCATE INMOVA APP                         ║
║     Servidor: {SSH_HOST}                                 ║
║     Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}                                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝{Colors.NC}
    """)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # ===========================================
        # PASO 1: Conectar
        # ===========================================
        log_step("1️⃣", "CONECTANDO AL SERVIDOR")
        log_info(f"Conectando a {SSH_USER}@{SSH_HOST}...")
        
        ssh.connect(
            hostname=SSH_HOST,
            port=SSH_PORT,
            username=SSH_USER,
            password=SSH_PASS,
            timeout=30,
            banner_timeout=30,
            auth_timeout=30
        )
        log_success("Conexión establecida")
        
        # ===========================================
        # PASO 2: Verificar estado del sistema
        # ===========================================
        log_step("2️⃣", "VERIFICANDO SISTEMA")
        
        # Memoria y disco
        exit_code, output, _ = exec_cmd(ssh, "free -h | grep Mem | awk '{print $2, $3, $4}'", show_output=False)
        if exit_code == 0:
            log_info(f"Memoria: {output.strip()}")
        
        exit_code, output, _ = exec_cmd(ssh, "df -h / | tail -1 | awk '{print $4}'", show_output=False)
        if exit_code == 0:
            log_info(f"Disco libre: {output.strip()}")
        
        # Verificar Docker
        exit_code, _, _ = exec_cmd(ssh, "command -v docker", show_output=False)
        if exit_code != 0:
            log_warning("Docker no instalado. Instalando...")
            exec_cmd(ssh, "apt update && apt install -y docker.io docker-compose", timeout=300)
            exec_cmd(ssh, "systemctl start docker && systemctl enable docker")
        log_success("Docker disponible")
        
        # Verificar Git
        exit_code, _, _ = exec_cmd(ssh, "command -v git", show_output=False)
        if exit_code != 0:
            log_warning("Git no instalado. Instalando...")
            exec_cmd(ssh, "apt install -y git", timeout=60)
        log_success("Git disponible")
        
        # ===========================================
        # PASO 3: Verificar/Clonar repositorio
        # ===========================================
        log_step("3️⃣", "GESTIONANDO REPOSITORIO")
        
        exit_code, _, _ = exec_cmd(ssh, f"test -d {REMOTE_PATH}/.git", show_output=False)
        
        if exit_code != 0:
            log_info("Repositorio no existe. Clonando...")
            exec_cmd(ssh, "mkdir -p /opt")
            
            # Clonar repositorio
            clone_cmd = f"cd /opt && git clone https://github.com/dvillagrablanco/inmova-app.git"
            exit_code, output, error = exec_cmd(ssh, clone_cmd, timeout=300)
            
            if exit_code != 0:
                log_error(f"Error clonando: {error}")
                sys.exit(1)
            log_success("Repositorio clonado")
        else:
            log_info("Repositorio existe. Actualizando...")
            
            # Fetch y reset
            cmds = [
                f"cd {REMOTE_PATH} && git fetch origin",
                f"cd {REMOTE_PATH} && git checkout {GIT_BRANCH}",
                f"cd {REMOTE_PATH} && git reset --hard origin/{GIT_BRANCH}",
                f"cd {REMOTE_PATH} && git pull origin {GIT_BRANCH}"
            ]
            
            for cmd in cmds:
                exec_cmd(ssh, cmd, show_output=False)
            
            log_success("Código actualizado")
        
        # ===========================================
        # PASO 4: Verificar .env.production
        # ===========================================
        log_step("4️⃣", "VERIFICANDO CONFIGURACIÓN")
        
        exit_code, _, _ = exec_cmd(ssh, f"test -f {REMOTE_PATH}/.env.production", show_output=False)
        
        if exit_code != 0:
            log_warning(".env.production no existe")
            # Buscar ejemplo y copiar
            exit_code, _, _ = exec_cmd(ssh, f"test -f {REMOTE_PATH}/.env.production.example", show_output=False)
            if exit_code == 0:
                exec_cmd(ssh, f"cp {REMOTE_PATH}/.env.production.example {REMOTE_PATH}/.env.production")
                log_info("Copiado .env.production.example -> .env.production")
            else:
                # Crear uno básico
                log_info("Creando .env.production básico...")
                env_content = '''DATABASE_URL="postgresql://dummy@localhost:5432/db"
NEXTAUTH_URL="http://157.180.119.236:3000"
NEXTAUTH_SECRET="super-secret-key-change-me"
NODE_ENV="production"
SKIP_ENV_VALIDATION="1"
'''
                exec_cmd(ssh, f'cat > {REMOTE_PATH}/.env.production << "EOF"\n{env_content}\nEOF')
        
        log_success("Configuración verificada")
        
        # Verificar contenido de .env.production
        exit_code, output, _ = exec_cmd(ssh, f"cat {REMOTE_PATH}/.env.production | grep -E 'DATABASE_URL|NEXTAUTH' | head -5", show_output=False)
        if output:
            log_info("Variables principales encontradas")
        
        # ===========================================
        # PASO 5: Detener contenedores anteriores
        # ===========================================
        log_step("5️⃣", "LIMPIANDO CONTENEDORES ANTERIORES")
        
        exec_cmd(ssh, "docker stop inmova-app-production 2>/dev/null || true", show_output=False)
        exec_cmd(ssh, "docker rm inmova-app-production 2>/dev/null || true", show_output=False)
        exec_cmd(ssh, "docker stop inmova-app_app_1 2>/dev/null || true", show_output=False)
        exec_cmd(ssh, "docker rm inmova-app_app_1 2>/dev/null || true", show_output=False)
        
        # Limpiar imágenes viejas
        exec_cmd(ssh, "docker system prune -f 2>/dev/null || true", show_output=False)
        
        log_success("Contenedores anteriores eliminados")
        
        # ===========================================
        # PASO 6: Build Docker
        # ===========================================
        log_step("6️⃣", "CONSTRUYENDO IMAGEN DOCKER")
        log_warning("Esto puede tardar 5-10 minutos...")
        
        build_cmd = f"""cd {REMOTE_PATH} && docker build \
            --no-cache \
            --build-arg NODE_ENV=production \
            --tag inmova-app:production \
            --file Dockerfile \
            . 2>&1 | tail -30"""
        
        log_info("Ejecutando build...")
        start_time = time.time()
        
        exit_code, output, error = exec_cmd(ssh, build_cmd, timeout=900, show_output=True)
        
        elapsed = time.time() - start_time
        log_info(f"Build completado en {elapsed:.0f} segundos")
        
        if exit_code != 0:
            log_error(f"Error en build: {error}")
            # Intentar ver logs más detallados
            log_info("Últimas líneas del error:")
            exec_cmd(ssh, f"cd {REMOTE_PATH} && docker build --tag inmova-app:production . 2>&1 | tail -50")
            sys.exit(1)
        
        log_success("Imagen Docker construida")
        
        # ===========================================
        # PASO 7: Iniciar contenedor
        # ===========================================
        log_step("7️⃣", "INICIANDO CONTENEDOR")
        
        run_cmd = f"""docker run -d \
            --name inmova-app-production \
            --env-file {REMOTE_PATH}/.env.production \
            --restart unless-stopped \
            -p 3000:3000 \
            inmova-app:production"""
        
        exit_code, output, error = exec_cmd(ssh, run_cmd, show_output=False)
        
        if exit_code != 0:
            log_error(f"Error iniciando contenedor: {error}")
            sys.exit(1)
        
        log_success("Contenedor iniciado")
        
        # Esperar que arranque
        log_info("Esperando que el servidor arranque (30s)...")
        time.sleep(30)
        
        # ===========================================
        # PASO 8: Health Check
        # ===========================================
        log_step("8️⃣", "VERIFICANDO ESTADO")
        
        # Verificar contenedor
        exit_code, output, _ = exec_cmd(ssh, "docker ps | grep inmova-app-production", show_output=False)
        
        if exit_code == 0 and 'Up' in output:
            log_success("Contenedor corriendo")
        else:
            log_error("Contenedor no está corriendo")
            log_info("Logs del contenedor:")
            exec_cmd(ssh, "docker logs --tail 50 inmova-app-production 2>&1")
            sys.exit(1)
        
        # Health check HTTP
        log_info("Verificando respuesta HTTP...")
        for attempt in range(5):
            exit_code, output, _ = exec_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --max-time 10", show_output=False)
            if exit_code == 0 and '200' in output:
                log_success(f"HTTP OK (código {output.strip()})")
                break
            elif attempt < 4:
                log_warning(f"Intento {attempt+1}/5 - esperando...")
                time.sleep(10)
            else:
                log_warning(f"HTTP respondió con código: {output.strip()}")
        
        # ===========================================
        # PASO 9: Resumen
        # ===========================================
        print(f"""
{Colors.GREEN}╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝{Colors.NC}

{Colors.CYAN}🌐 URLs:{Colors.NC}
   • IP directa: http://157.180.119.236:3000
   • Dominio: https://inmovaapp.com (si DNS configurado)

{Colors.CYAN}📋 Comandos útiles:{Colors.NC}
   • Ver logs: docker logs -f inmova-app-production
   • Reiniciar: docker restart inmova-app-production
   • Estado: docker ps
   • Shell: docker exec -it inmova-app-production sh

{Colors.YELLOW}⚠️  IMPORTANTE:{Colors.NC}
   1. Verificar .env.production tiene las variables correctas:
      - DATABASE_URL (conexión a PostgreSQL real)
      - NEXTAUTH_SECRET (secret seguro)
      - NEXTAUTH_URL (URL pública)
   
   2. Si la app falla, revisar logs:
      docker logs inmova-app-production

{Colors.GREEN}✨ ¡Deployment exitoso!{Colors.NC}
        """)
        
        # Mostrar estado final
        log_info("Estado del contenedor:")
        exec_cmd(ssh, "docker ps --filter name=inmova-app-production --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
        
    except paramiko.AuthenticationException:
        log_error("Error de autenticación - usuario/contraseña incorrectos")
        sys.exit(1)
    except paramiko.SSHException as e:
        log_error(f"Error SSH: {e}")
        sys.exit(1)
    except Exception as e:
        log_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        ssh.close()
        log_info("Conexión SSH cerrada")

if __name__ == "__main__":
    main()
