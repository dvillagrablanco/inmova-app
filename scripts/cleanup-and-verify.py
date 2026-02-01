#!/usr/bin/env python3
"""
Script para limpiar placeholders y verificar credenciales reales.
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
    print(f"{Colors.MAGENTA}🧹 LIMPIEZA Y VERIFICACIÓN DE CREDENCIALES{Colors.END}")
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
    
    # Placeholders conocidos que deben eliminarse
    placeholders = [
        'ACxxxxx',
        'your-token',
        '<TU_',
        'placeholder',
        'xxx',
        'your_',
    ]
    
    # Leer archivo actual
    status, content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
    
    lines_to_keep = []
    removed_lines = []
    
    for line in content.split('\n'):
        if '=' in line and not line.startswith('#'):
            key = line.split('=')[0].strip()
            value = '='.join(line.split('=')[1:]).strip().strip('"').strip("'")
            
            is_placeholder = False
            for p in placeholders:
                if p.lower() in value.lower():
                    is_placeholder = True
                    break
            
            if is_placeholder:
                removed_lines.append(line)
                log(f"  ❌ Eliminando placeholder: {key}", Colors.YELLOW)
            else:
                lines_to_keep.append(line)
        else:
            lines_to_keep.append(line)
    
    # Guardar archivo limpio
    if removed_lines:
        log(f"\n📝 Eliminando {len(removed_lines)} placeholders...", Colors.BLUE)
        
        # Backup
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.cleanup.$(date +%Y%m%d_%H%M%S)")
        
        # Escribir archivo limpio
        new_content = '\n'.join(lines_to_keep)
        # Escapar para echo
        escaped_content = new_content.replace("'", "'\\''")
        exec_cmd(client, f"echo '{escaped_content}' > {APP_PATH}/.env.production")
        
        # Copiar a .env.local
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
        
        log("✅ Archivo limpiado", Colors.GREEN)
    
    # Verificar Redis local
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🗄️ VERIFICANDO REDIS LOCAL", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, "redis-cli ping 2>/dev/null")
    if output == 'PONG':
        log("✅ Redis local funcional", Colors.GREEN)
        
        # Verificar si REDIS_URL está configurado
        status, output = exec_cmd(client, f"grep '^REDIS_URL=' {APP_PATH}/.env.production")
        if not output:
            log("  Añadiendo REDIS_URL=redis://localhost:6379", Colors.YELLOW)
            exec_cmd(client, f"echo 'REDIS_URL=redis://localhost:6379' >> {APP_PATH}/.env.production")
    else:
        log("⚠️ Redis no está corriendo localmente", Colors.YELLOW)
    
    # Verificar todas las integraciones
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.END}")
    log("📊 ESTADO FINAL DE INTEGRACIONES", Colors.MAGENTA)
    print(f"{Colors.MAGENTA}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -v '^#' | grep -v '^$' | cut -d'=' -f1 | sort | uniq")
    configured = set(output.split('\n')) if output else set()
    
    integrations = {
        "Autenticación (NextAuth)": {
            "vars": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
            "icon": "🔐"
        },
        "Base de Datos (PostgreSQL)": {
            "vars": ["DATABASE_URL"],
            "icon": "💾"
        },
        "Pagos (Stripe)": {
            "vars": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
            "icon": "💳"
        },
        "Email (Gmail SMTP)": {
            "vars": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_PORT", "SMTP_FROM"],
            "icon": "📧"
        },
        "Analytics (Google GA4)": {
            "vars": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
            "icon": "📊"
        },
        "Storage (AWS S3)": {
            "vars": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET"],
            "icon": "☁️"
        },
        "Push Notifications (VAPID)": {
            "vars": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
            "icon": "🔔"
        },
        "IA (Anthropic Claude)": {
            "vars": ["ANTHROPIC_API_KEY"],
            "icon": "🤖"
        },
        "Cache (Redis)": {
            "vars": ["REDIS_URL"],
            "icon": "🗄️"
        },
        "SMS (Twilio)": {
            "vars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
            "icon": "📱"
        },
        "Monitoreo (Sentry)": {
            "vars": ["SENTRY_DSN"],
            "icon": "🔍"
        },
        "Firma Digital (Signaturit)": {
            "vars": ["SIGNATURIT_API_KEY"],
            "icon": "✍️"
        },
    }
    
    complete_count = 0
    partial_count = 0
    missing_count = 0
    
    for name, info in integrations.items():
        vars_needed = info["vars"]
        icon = info["icon"]
        count = sum(1 for v in vars_needed if v in configured)
        total = len(vars_needed)
        
        if count == total:
            status_str = f"{Colors.GREEN}✅ COMPLETA{Colors.END}"
            complete_count += 1
        elif count > 0:
            status_str = f"{Colors.YELLOW}⚠️ PARCIAL ({count}/{total}){Colors.END}"
            partial_count += 1
        else:
            status_str = f"{Colors.RED}❌ FALTANTE{Colors.END}"
            missing_count += 1
        
        print(f"  {icon} {name:<30} {status_str}")
    
    # Resumen
    print(f"\n{Colors.GREEN}{'='*70}{Colors.END}")
    print(f"\n  📈 RESUMEN:")
    print(f"     ✅ Completas: {complete_count}")
    print(f"     ⚠️ Parciales: {partial_count}")
    print(f"     ❌ Faltantes: {missing_count}")
    print(f"     📊 Porcentaje: {(complete_count / len(integrations)) * 100:.0f}%")
    
    # Reiniciar PM2
    log("\n♻️ Reiniciando PM2 con configuración final...", Colors.BLUE)
    exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
    status, output = exec_cmd(client, "pm2 restart inmova-app --update-env", timeout=120)
    time.sleep(15)
    
    status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
    if '"status":"ok"' in output:
        log("✅ Health check: OK", Colors.GREEN)
    else:
        log(f"⚠️ Health: {output[:50]}", Colors.YELLOW)
    
    print(f"\n{Colors.GREEN}{'='*70}{Colors.END}")
    print(f"{Colors.GREEN}✅ CONFIGURACIÓN COMPLETADA{Colors.END}")
    print(f"{Colors.GREEN}{'='*70}{Colors.END}\n")
    
    client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
