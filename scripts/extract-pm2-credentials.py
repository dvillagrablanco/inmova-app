#!/usr/bin/env python3
"""
Script para extraer credenciales completas del dump de PM2.
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import json
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
    print(f"{Colors.MAGENTA}🔑 EXTRACCIÓN DE CREDENCIALES DE PM2 DUMP{Colors.END}")
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
    
    # Leer el dump de PM2
    log("📂 Leyendo dump de PM2...", Colors.CYAN)
    status, output = exec_cmd(client, "cat /root/.pm2/dump.pm2")
    
    if status != 0 or not output:
        log("❌ No se pudo leer el dump de PM2", Colors.RED)
        client.close()
        return 1
    
    # Parsear JSON
    try:
        pm2_dump = json.loads(output)
    except json.JSONDecodeError as e:
        log(f"❌ Error parseando JSON: {e}", Colors.RED)
        client.close()
        return 1
    
    # Extraer variables de entorno
    log("🔍 Extrayendo variables de entorno...", Colors.CYAN)
    
    # Variables que buscamos
    target_vars = [
        "ANTHROPIC_API_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY", 
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER",
        "SENTRY_DSN",
        "REDIS_URL",
        "SIGNATURIT_API_KEY",
        "ABACUSAI_API_KEY",
        "SENDGRID_API_KEY",
        "MAPBOX_TOKEN",
        "NEXT_PUBLIC_MAPBOX_TOKEN",
    ]
    
    found_vars = {}
    
    # Buscar en cada proceso del dump
    for process in pm2_dump:
        if 'pm2_env' in process:
            env = process['pm2_env']
            for key in target_vars:
                if key in env and env[key]:
                    value = env[key]
                    if value and len(value) > 5 and value not in ['undefined', 'null', '']:
                        found_vars[key] = value
        
        if 'env' in process:
            env = process['env']
            for key in target_vars:
                if key in env and env[key]:
                    value = env[key]
                    if value and len(value) > 5 and value not in ['undefined', 'null', '']:
                        found_vars[key] = value
    
    # También buscar en env anidado
    def search_nested(obj, keys):
        results = {}
        if isinstance(obj, dict):
            for key in keys:
                if key in obj and obj[key]:
                    results[key] = obj[key]
            for v in obj.values():
                results.update(search_nested(v, keys))
        elif isinstance(obj, list):
            for item in obj:
                results.update(search_nested(item, keys))
        return results
    
    found_vars.update(search_nested(pm2_dump, target_vars))
    
    # Mostrar resultados
    print(f"\n{Colors.GREEN}{'='*70}{Colors.END}")
    log("📊 CREDENCIALES ENCONTRADAS EN PM2 DUMP", Colors.GREEN)
    print(f"{Colors.GREEN}{'='*70}{Colors.END}\n")
    
    if found_vars:
        for key, value in found_vars.items():
            # Mostrar valor completo pero truncado para display
            display_value = value[:50] + "..." if len(value) > 50 else value
            print(f"  {Colors.CYAN}{key}{Colors.END}={display_value}")
        
        # Guardar las credenciales encontradas
        print(f"\n{Colors.YELLOW}{'='*70}{Colors.END}")
        log("🔧 CONFIGURANDO CREDENCIALES EN .env.production", Colors.YELLOW)
        print(f"{Colors.YELLOW}{'='*70}{Colors.END}\n")
        
        # Backup
        log("💾 Creando backup...", Colors.BLUE)
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.pm2.$(date +%Y%m%d_%H%M%S)")
        
        configured_count = 0
        for key, value in found_vars.items():
            # Verificar si ya existe
            check_cmd = f"grep -q '^{key}=' {APP_PATH}/.env.production && echo EXISTS || echo NOT_EXISTS"
            status, exists = exec_cmd(client, check_cmd)
            
            # Escapar caracteres especiales para sed
            escaped_value = value.replace('/', '\\/').replace('&', '\\&').replace('"', '\\"')
            
            if exists == 'EXISTS':
                # Actualizar
                cmd = f"sed -i 's|^{key}=.*|{key}={escaped_value}|' {APP_PATH}/.env.production"
            else:
                # Añadir
                cmd = f"echo '{key}={value}' >> {APP_PATH}/.env.production"
            
            status, _ = exec_cmd(client, cmd)
            if status == 0:
                log(f"  ✅ {key} configurada", Colors.GREEN)
                configured_count += 1
            else:
                log(f"  ❌ Error configurando {key}", Colors.RED)
        
        # Copiar a .env.local
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
        
        log(f"\n✅ {configured_count} variables configuradas", Colors.GREEN)
        
        # Reiniciar PM2
        if configured_count > 0:
            log("\n♻️ Reiniciando PM2...", Colors.BLUE)
            status, output = exec_cmd(client, "pm2 restart inmova-app --update-env", timeout=120)
            
            if status == 0:
                log("✅ PM2 reiniciado", Colors.GREEN)
            else:
                log(f"⚠️ Output: {output[:100]}", Colors.YELLOW)
            
            # Esperar warm-up
            time.sleep(15)
            
            # Health check
            status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            if '"status":"ok"' in output:
                log("✅ Health check: OK", Colors.GREEN)
            else:
                log(f"⚠️ Health: {output[:50]}", Colors.YELLOW)
    else:
        log("❌ No se encontraron credenciales adicionales en PM2 dump", Colors.YELLOW)
    
    # También buscar en archivos .env de /root
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📁 BUSCANDO EN BACKUPS DE /root", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, "cat /root/.env.inmova.backup 2>/dev/null")
    if output:
        log("Contenido de /root/.env.inmova.backup:", Colors.YELLOW)
        for line in output.split('\n'):
            if '=' in line and not line.startswith('#'):
                key = line.split('=')[0].strip()
                value = '='.join(line.split('=')[1:]).strip()
                if key in target_vars and value:
                    print(f"  {Colors.GREEN}{key}{Colors.END}={value[:40]}...")
                    
                    # Configurar si no existe
                    check_cmd = f"grep -q '^{key}=' {APP_PATH}/.env.production && echo EXISTS || echo NOT_EXISTS"
                    status, exists = exec_cmd(client, check_cmd)
                    
                    if exists == 'NOT_EXISTS':
                        cmd = f"echo '{key}={value}' >> {APP_PATH}/.env.production"
                        exec_cmd(client, cmd)
                        log(f"    → Añadido a .env.production", Colors.GREEN)
    
    # Verificar estado final
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.END}")
    log("📊 ESTADO FINAL DE INTEGRACIONES", Colors.MAGENTA)
    print(f"{Colors.MAGENTA}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -v '^#' | grep -v '^$' | cut -d'=' -f1 | sort | uniq")
    configured = set(output.split('\n')) if output else set()
    
    integrations = {
        "Autenticación": (["NEXTAUTH_SECRET", "NEXTAUTH_URL"], "✅"),
        "Base de Datos": (["DATABASE_URL"], "✅"),
        "Stripe": (["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"], "💳"),
        "Email SMTP": (["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"], "📧"),
        "Google Analytics": (["NEXT_PUBLIC_GA_MEASUREMENT_ID"], "📊"),
        "AWS S3": (["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET"], "☁️"),
        "Push Notifications": (["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"], "🔔"),
        "Anthropic AI": (["ANTHROPIC_API_KEY"], "🤖"),
        "Twilio SMS": (["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], "📱"),
        "Sentry": (["SENTRY_DSN"], "🔍"),
        "Redis": (["REDIS_URL"], "🗄️"),
        "Signaturit": (["SIGNATURIT_API_KEY"], "✍️"),
    }
    
    for name, (vars_needed, icon) in integrations.items():
        count = sum(1 for v in vars_needed if v in configured)
        total = len(vars_needed)
        
        if count == total:
            status_str = f"{Colors.GREEN}✅ COMPLETA{Colors.END}"
        elif count > 0:
            status_str = f"{Colors.YELLOW}⚠️ PARCIAL ({count}/{total}){Colors.END}"
        else:
            status_str = f"{Colors.RED}❌ FALTANTE{Colors.END}"
        
        print(f"  {icon} {name:<25} {status_str}")
    
    client.close()
    log("\n🔐 Conexión cerrada", Colors.BLUE)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
