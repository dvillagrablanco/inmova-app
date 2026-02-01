#!/usr/bin/env python3
"""
Script para buscar las credenciales restantes: Twilio, Sentry, Redis, Signaturit
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=120):
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore').strip()
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.END}")
    print(f"{Colors.MAGENTA}🔍 BÚSQUEDA DE CREDENCIALES RESTANTES{Colors.END}")
    print(f"{Colors.MAGENTA}{'='*70}{Colors.END}\n")
    
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    
    found_credentials = {}
    
    # 1. Buscar en todos los archivos .env del sistema
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔍 1. BÚSQUEDA EXHAUSTIVA DE TWILIO", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    # Buscar Twilio
    twilio_searches = [
        f"grep -r 'TWILIO' {APP_PATH} --include='*.env*' 2>/dev/null",
        f"grep -r 'TWILIO' /root/ --include='*.env*' 2>/dev/null",
        f"grep -r 'AC[a-f0-9]{{32}}' {APP_PATH} --include='*.env*' 2>/dev/null",
        "env | grep -i TWILIO",
        f"cat {APP_PATH}/.env.production.example | grep TWILIO",
    ]
    
    for search in twilio_searches:
        status, output = exec_cmd(client, search)
        if output and "No such file" not in output:
            log(f"Twilio encontrado:", Colors.GREEN)
            for line in output.split('\n')[:5]:
                if '=' in line and 'TWILIO' in line.upper():
                    key = line.split('=')[0].strip().split(':')[-1]
                    value = '='.join(line.split('=')[1:]).strip().strip('"').strip("'")
                    if value and len(value) > 5:
                        found_credentials[key] = value
                        print(f"  {key}={value[:40]}...")
    
    # 2. Buscar Sentry
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔍 2. BÚSQUEDA EXHAUSTIVA DE SENTRY", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    sentry_searches = [
        f"grep -r 'SENTRY' {APP_PATH} --include='*.env*' 2>/dev/null",
        f"grep -r 'sentry.io' {APP_PATH} --include='*.env*' --include='*.js' --include='*.ts' 2>/dev/null | head -10",
        f"grep -r 'SENTRY' /root/ --include='*.env*' 2>/dev/null",
        "env | grep -i SENTRY",
    ]
    
    for search in sentry_searches:
        status, output = exec_cmd(client, search)
        if output and "No such file" not in output:
            log(f"Sentry encontrado:", Colors.GREEN)
            for line in output.split('\n')[:5]:
                if 'SENTRY_DSN' in line and '=' in line:
                    key = 'SENTRY_DSN'
                    value = '='.join(line.split('=')[1:]).strip().strip('"').strip("'")
                    if value and 'sentry.io' in value:
                        found_credentials[key] = value
                        print(f"  {key}={value[:50]}...")
    
    # 3. Buscar Redis
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔍 3. BÚSQUEDA EXHAUSTIVA DE REDIS", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    redis_searches = [
        f"grep -r 'REDIS_URL' {APP_PATH} --include='*.env*' 2>/dev/null",
        f"grep -r 'redis://' {APP_PATH} --include='*.env*' 2>/dev/null",
        f"grep -r 'UPSTASH' {APP_PATH} --include='*.env*' 2>/dev/null",
        "env | grep -i REDIS",
        "redis-cli ping 2>/dev/null && echo 'Redis local activo'",
    ]
    
    for search in redis_searches:
        status, output = exec_cmd(client, search)
        if output and "No such file" not in output:
            log(f"Redis encontrado:", Colors.GREEN)
            for line in output.split('\n')[:5]:
                if 'REDIS' in line.upper() and '=' in line:
                    key = line.split('=')[0].strip().split(':')[-1]
                    value = '='.join(line.split('=')[1:]).strip().strip('"').strip("'")
                    if value and ('redis://' in value or 'upstash' in value.lower()):
                        found_credentials[key] = value
                        print(f"  {key}={value[:50]}...")
    
    # Verificar si Redis está instalado localmente
    status, output = exec_cmd(client, "systemctl is-active redis-server 2>/dev/null || systemctl is-active redis 2>/dev/null")
    if output == 'active':
        log("✅ Redis está corriendo localmente", Colors.GREEN)
        found_credentials['REDIS_URL'] = 'redis://localhost:6379'
    
    # 4. Buscar Signaturit
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔍 4. BÚSQUEDA EXHAUSTIVA DE SIGNATURIT", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    signaturit_searches = [
        f"grep -r 'SIGNATURIT' {APP_PATH} --include='*.env*' 2>/dev/null",
        f"grep -r 'signaturit' {APP_PATH} --include='*.env*' --include='*.js' --include='*.ts' 2>/dev/null | head -10",
        f"grep -r 'SIGNATURIT' /root/ --include='*.env*' 2>/dev/null",
    ]
    
    for search in signaturit_searches:
        status, output = exec_cmd(client, search)
        if output and "No such file" not in output:
            log(f"Signaturit encontrado:", Colors.GREEN)
            for line in output.split('\n')[:5]:
                if 'SIGNATURIT' in line.upper() and '=' in line:
                    key = line.split('=')[0].strip().split(':')[-1]
                    value = '='.join(line.split('=')[1:]).strip().strip('"').strip("'")
                    if value and len(value) > 5:
                        found_credentials[key] = value
                        print(f"  {key}={value[:40]}...")
    
    # 5. Buscar en documentación del workspace local
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔍 5. VERIFICANDO DOCUMENTACIÓN LOCAL", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    # Verificar si hay Redis instalado y configurarlo
    if 'REDIS_URL' not in found_credentials:
        status, output = exec_cmd(client, "which redis-server")
        if output:
            log("Redis está instalado. Verificando si podemos usarlo...", Colors.YELLOW)
            status, output = exec_cmd(client, "redis-cli ping 2>/dev/null")
            if output == 'PONG':
                found_credentials['REDIS_URL'] = 'redis://localhost:6379'
                log("✅ Redis local funcional: redis://localhost:6379", Colors.GREEN)
    
    # 6. Configurar las credenciales encontradas
    print(f"\n{Colors.YELLOW}{'='*70}{Colors.END}")
    log("🔧 CONFIGURANDO CREDENCIALES ENCONTRADAS", Colors.YELLOW)
    print(f"{Colors.YELLOW}{'='*70}{Colors.END}\n")
    
    if found_credentials:
        log("💾 Creando backup...", Colors.BLUE)
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.remaining.$(date +%Y%m%d_%H%M%S)")
        
        for key, value in found_credentials.items():
            # Verificar si ya existe con valor válido
            check_cmd = f"grep '^{key}=' {APP_PATH}/.env.production | cut -d'=' -f2-"
            status, existing = exec_cmd(client, check_cmd)
            
            if existing and len(existing.strip()) > 5 and existing.strip() not in ['""', "''"]:
                log(f"  ⏭️ {key} ya configurado", Colors.YELLOW)
                continue
            
            # Verificar si existe la línea
            check_exists = f"grep -q '^{key}=' {APP_PATH}/.env.production && echo EXISTS || echo NOT_EXISTS"
            status, exists = exec_cmd(client, check_exists)
            
            if exists == 'EXISTS':
                cmd = f"sed -i 's|^{key}=.*|{key}={value}|' {APP_PATH}/.env.production"
            else:
                cmd = f"echo '{key}={value}' >> {APP_PATH}/.env.production"
            
            status, _ = exec_cmd(client, cmd)
            if status == 0:
                log(f"  ✅ {key} configurado", Colors.GREEN)
            else:
                log(f"  ❌ Error con {key}", Colors.RED)
        
        # Copiar a .env.local
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
        
        # Reiniciar PM2
        log("\n♻️ Reiniciando PM2...", Colors.BLUE)
        status, output = exec_cmd(client, "pm2 restart inmova-app --update-env", timeout=120)
        time.sleep(15)
        
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output:
            log("✅ Health check: OK", Colors.GREEN)
    else:
        log("No se encontraron credenciales adicionales para configurar", Colors.YELLOW)
    
    # 7. Estado final
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.END}")
    log("📊 ESTADO FINAL DE INTEGRACIONES", Colors.MAGENTA)
    print(f"{Colors.MAGENTA}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -v '^#' | grep -v '^$'")
    
    log("Variables configuradas:", Colors.CYAN)
    for line in output.split('\n'):
        if '=' in line:
            key = line.split('=')[0].strip()
            value = '='.join(line.split('=')[1:]).strip()
            # Ocultar valores sensibles
            if any(s in key.upper() for s in ['SECRET', 'PASSWORD', 'KEY', 'TOKEN', 'URL']):
                if len(value) > 15:
                    value = value[:10] + "..." + value[-5:]
            print(f"  {key}={value}")
    
    client.close()
    log("\n🔐 Conexión cerrada", Colors.BLUE)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
