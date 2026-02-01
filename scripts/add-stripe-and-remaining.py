#!/usr/bin/env python3
"""
Script para añadir las credenciales faltantes de Stripe y otras integraciones.
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    return exit_status, output

def main():
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    
    # 1. Verificar variables de Stripe actuales en el servidor
    log("📋 Verificando variables de Stripe en el servidor...", Colors.BLUE)
    status, output = exec_cmd(client, f"grep -E '^STRIPE' {APP_PATH}/.env.production 2>/dev/null || echo 'NO_STRIPE'")
    
    if output == 'NO_STRIPE':
        log("⚠️ No hay variables de Stripe configuradas", Colors.YELLOW)
    else:
        log("Variables de Stripe actuales:", Colors.GREEN)
        for line in output.split('\n'):
            if line:
                key = line.split('=')[0]
                value = '='.join(line.split('=')[1:])
                # Ocultar valores sensibles
                if len(value) > 20:
                    value = value[:15] + "..."
                print(f"  {key}={value}")
    
    # 2. Buscar en archivos .env.local, .env.production.backup, etc.
    log("\n📂 Buscando credenciales de Stripe en archivos de backup...", Colors.BLUE)
    
    search_files = [
        f"{APP_PATH}/.env.local",
        f"{APP_PATH}/.env.production.backup*",
        f"{APP_PATH}/.env.production.backup.stripe*",
        f"{APP_PATH}/.env"
    ]
    
    stripe_vars = {}
    
    for pattern in search_files:
        status, output = exec_cmd(client, f"cat {pattern} 2>/dev/null | grep -E '^STRIPE|^NEXT_PUBLIC_STRIPE' || true")
        if output:
            log(f"  Encontrado en {pattern}:", Colors.GREEN)
            for line in output.split('\n'):
                if line and '=' in line:
                    key = line.split('=')[0].strip()
                    value = '='.join(line.split('=')[1:]).strip()
                    # Limpiar comillas
                    value = value.strip('"').strip("'")
                    if key not in stripe_vars and value and 'placeholder' not in value.lower():
                        stripe_vars[key] = value
                        print(f"    {key}={value[:20]}...")
    
    # 3. Si encontramos variables de Stripe, añadirlas a .env.production
    if stripe_vars:
        log(f"\n✅ Encontradas {len(stripe_vars)} variables de Stripe", Colors.GREEN)
        
        # Crear backup
        log("💾 Creando backup...", Colors.BLUE)
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.$(date +%Y%m%d_%H%M%S)")
        
        for key, value in stripe_vars.items():
            # Escapar caracteres especiales
            escaped_value = value.replace('"', '\\"')
            
            # Verificar si existe
            check = f"grep -q '^{key}=' {APP_PATH}/.env.production && echo EXISTS || echo NOT_EXISTS"
            status, exists = exec_cmd(client, check)
            
            if exists == 'EXISTS':
                # Actualizar
                cmd = f"sed -i 's|^{key}=.*|{key}={escaped_value}|' {APP_PATH}/.env.production"
            else:
                # Añadir
                cmd = f"echo '{key}={escaped_value}' >> {APP_PATH}/.env.production"
            
            status, _ = exec_cmd(client, cmd)
            log(f"  ✅ {key} configurada", Colors.GREEN)
        
        # Copiar a .env.local
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
        
        # Reiniciar PM2
        log("\n♻️ Reiniciando PM2...", Colors.BLUE)
        status, output = exec_cmd(client, "pm2 restart inmova-app --update-env", timeout=120)
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        time.sleep(15)
        
        # Health check
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)
    else:
        log("⚠️ No se encontraron credenciales de Stripe en backups", Colors.YELLOW)
        log("Las claves de Stripe documentadas son parciales:", Colors.YELLOW)
        print("  - STRIPE_SECRET_KEY: rk_live_51Sf0V7... (necesita el valor completo)")
        print("  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_live_515f0V7... (necesita el valor completo)")
        print("  - STRIPE_WEBHOOK_SECRET: whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe (completa)")
        
        # Al menos añadir el webhook secret que sí tenemos completo
        log("\n🔧 Añadiendo STRIPE_WEBHOOK_SECRET (único valor completo disponible)...", Colors.BLUE)
        webhook_secret = "whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe"
        
        # Verificar si existe
        check = f"grep -q '^STRIPE_WEBHOOK_SECRET=' {APP_PATH}/.env.production && echo EXISTS || echo NOT_EXISTS"
        status, exists = exec_cmd(client, check)
        
        if exists == 'EXISTS':
            cmd = f"sed -i 's|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET={webhook_secret}|' {APP_PATH}/.env.production"
        else:
            cmd = f"echo 'STRIPE_WEBHOOK_SECRET={webhook_secret}' >> {APP_PATH}/.env.production"
        
        exec_cmd(client, cmd)
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
        log("✅ STRIPE_WEBHOOK_SECRET configurado", Colors.GREEN)
    
    # 4. Verificar estado final
    print(f"\n{'='*70}")
    log("📊 ESTADO FINAL DE INTEGRACIONES", Colors.BLUE)
    print(f"{'='*70}\n")
    
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -v '^#' | grep -v '^$' | cut -d'=' -f1")
    
    configured = set(output.split('\n')) if output else set()
    
    integrations = {
        "Autenticación": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
        "Base de Datos": ["DATABASE_URL"],
        "Stripe": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
        "Email SMTP": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
        "Google Analytics": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
        "AWS S3": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET_NAME"],
        "Push Notifications": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
    }
    
    for name, vars_needed in integrations.items():
        count = sum(1 for v in vars_needed if v in configured)
        total = len(vars_needed)
        
        if count == total:
            status_str = f"{Colors.GREEN}✅ COMPLETA{Colors.END}"
        elif count > 0:
            status_str = f"{Colors.YELLOW}⚠️ PARCIAL ({count}/{total}){Colors.END}"
        else:
            status_str = f"{Colors.RED}❌ FALTANTE{Colors.END}"
        
        print(f"  {name:<25} {status_str}")
    
    client.close()
    log("\n🔐 Conexión cerrada", Colors.BLUE)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
