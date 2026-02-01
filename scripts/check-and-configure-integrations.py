#!/usr/bin/env python3
"""
Script para verificar y configurar integraciones parciales en el servidor.
Busca credenciales en documentación y las configura en producción.
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import re

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Credenciales encontradas en documentación
CREDENTIALS_FOUND = {
    # Gmail SMTP (documentado en RESUMEN_GMAIL_SMTP_COMPLETADO.md)
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_SECURE": "false",
    "SMTP_USER": "inmovaapp@gmail.com",
    "SMTP_PASSWORD": "eeemxyuasvsnyxyu",
    "SMTP_FROM": '"Inmova App <inmovaapp@gmail.com>"',
    
    # Google Analytics (documentado en STATUS_ACTUALIZADO_04_ENE_2026.md)
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": "G-WX2LE41M4T",
    
    # NextAuth (ya debería estar configurado)
    "NEXTAUTH_URL": "https://inmovaapp.com",
}

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, cmd, timeout=60):
    """Ejecuta un comando SSH y retorna (status, output)"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    if error and exit_status != 0:
        return exit_status, error
    return exit_status, output

def main():
    print(f"\n{Colors.HEADER}{'='*70}{Colors.END}")
    print(f"{Colors.HEADER}🔧 VERIFICACIÓN Y CONFIGURACIÓN DE INTEGRACIONES{Colors.END}")
    print(f"{Colors.HEADER}{'='*70}{Colors.END}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.CYAN)
    log(f"App Path: {APP_PATH}", Colors.CYAN)
    
    # Conectar al servidor
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30,
            look_for_keys=False,
            allow_agent=False
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1
    
    # 1. Obtener variables de entorno actuales
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📋 VERIFICANDO VARIABLES DE ENTORNO ACTUALES", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production 2>/dev/null || cat {APP_PATH}/.env.local 2>/dev/null || echo 'NO_ENV_FILE'")
    
    if output == 'NO_ENV_FILE':
        log("⚠️ No se encontró archivo .env.production ni .env.local", Colors.YELLOW)
        current_env = {}
    else:
        # Parsear variables actuales
        current_env = {}
        for line in output.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key = line.split('=')[0].strip()
                value = '='.join(line.split('=')[1:]).strip()
                current_env[key] = value
    
    # Lista de variables críticas a verificar
    critical_vars = [
        # Autenticación
        ("NEXTAUTH_SECRET", "Autenticación"),
        ("NEXTAUTH_URL", "Autenticación"),
        
        # Base de datos
        ("DATABASE_URL", "Base de Datos"),
        
        # Stripe
        ("STRIPE_SECRET_KEY", "Pagos Stripe"),
        ("STRIPE_WEBHOOK_SECRET", "Pagos Stripe"),
        ("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "Pagos Stripe"),
        
        # Email
        ("SMTP_HOST", "Email SMTP"),
        ("SMTP_USER", "Email SMTP"),
        ("SMTP_PASSWORD", "Email SMTP"),
        
        # Google Analytics
        ("NEXT_PUBLIC_GA_MEASUREMENT_ID", "Analytics"),
        
        # AWS S3
        ("AWS_ACCESS_KEY_ID", "Storage S3"),
        ("AWS_SECRET_ACCESS_KEY", "Storage S3"),
        ("AWS_BUCKET_NAME", "Storage S3"),
        
        # Twilio
        ("TWILIO_ACCOUNT_SID", "SMS Twilio"),
        ("TWILIO_AUTH_TOKEN", "SMS Twilio"),
        
        # Sentry
        ("SENTRY_DSN", "Monitoreo"),
        
        # VAPID
        ("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "Push Notifications"),
        ("VAPID_PRIVATE_KEY", "Push Notifications"),
        
        # AI
        ("ANTHROPIC_API_KEY", "IA Claude"),
        ("ABACUSAI_API_KEY", "IA Abacus"),
        
        # Redis
        ("REDIS_URL", "Cache Redis"),
        
        # Signaturit
        ("SIGNATURIT_API_KEY", "Firma Digital"),
    ]
    
    print(f"\n📊 Estado de Variables de Entorno:\n")
    print(f"{'Variable':<40} {'Categoría':<20} {'Estado':<15}")
    print("-" * 75)
    
    missing_vars = []
    configured_vars = []
    
    for var, category in critical_vars:
        if var in current_env:
            value = current_env[var]
            # Ocultar valores sensibles
            if 'SECRET' in var or 'PASSWORD' in var or 'KEY' in var or 'TOKEN' in var:
                display_value = value[:10] + "..." if len(value) > 10 else value
            else:
                display_value = value[:30] + "..." if len(value) > 30 else value
            
            # Verificar si es placeholder
            if 'placeholder' in value.lower() or 'dummy' in value.lower() or 'xxx' in value.lower():
                print(f"{var:<40} {category:<20} {Colors.YELLOW}⚠️ PLACEHOLDER{Colors.END}")
                missing_vars.append((var, category))
            else:
                print(f"{var:<40} {category:<20} {Colors.GREEN}✅ Configurada{Colors.END}")
                configured_vars.append(var)
        else:
            print(f"{var:<40} {category:<20} {Colors.RED}❌ Faltante{Colors.END}")
            missing_vars.append((var, category))
    
    print(f"\n{Colors.GREEN}✅ Configuradas: {len(configured_vars)}{Colors.END}")
    print(f"{Colors.RED}❌ Faltantes: {len(missing_vars)}{Colors.END}")
    
    # 2. Configurar variables faltantes que tenemos credenciales
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔧 CONFIGURANDO VARIABLES FALTANTES", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    vars_to_add = []
    
    for var, value in CREDENTIALS_FOUND.items():
        if var not in current_env or 'placeholder' in current_env.get(var, '').lower():
            vars_to_add.append((var, value))
            log(f"  → Añadiendo {var}", Colors.YELLOW)
    
    if vars_to_add:
        # Crear backup
        log("💾 Creando backup de .env.production...", Colors.BLUE)
        status, _ = exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.$(date +%Y%m%d_%H%M%S)")
        
        # Añadir variables
        for var, value in vars_to_add:
            # Escapar comillas en el valor
            escaped_value = value.replace('"', '\\"')
            
            # Verificar si la variable ya existe
            check_cmd = f"grep -q '^{var}=' {APP_PATH}/.env.production 2>/dev/null && echo 'EXISTS' || echo 'NOT_EXISTS'"
            status, exists = exec_cmd(client, check_cmd)
            
            if exists == 'EXISTS':
                # Actualizar variable existente
                cmd = f"sed -i 's|^{var}=.*|{var}={escaped_value}|' {APP_PATH}/.env.production"
            else:
                # Añadir nueva variable
                cmd = f"echo '{var}={escaped_value}' >> {APP_PATH}/.env.production"
            
            status, _ = exec_cmd(client, cmd)
            if status == 0:
                log(f"  ✅ {var} configurada", Colors.GREEN)
            else:
                log(f"  ❌ Error configurando {var}", Colors.RED)
        
        # También copiar a .env.local
        log("📋 Copiando a .env.local...", Colors.BLUE)
        exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
        
        # Reiniciar PM2
        log("♻️ Reiniciando PM2 con nuevas variables...", Colors.BLUE)
        status, output = exec_cmd(client, "pm2 restart inmova-app --update-env", timeout=120)
        
        if status == 0:
            log("✅ PM2 reiniciado exitosamente", Colors.GREEN)
        else:
            log(f"⚠️ PM2 restart output: {output}", Colors.YELLOW)
        
        # Esperar warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.BLUE)
        time.sleep(15)
        
        # Verificar health
        log("🏥 Verificando health check...", Colors.BLUE)
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        
        if '"status":"ok"' in output:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)
    else:
        log("✅ Todas las credenciales documentadas ya están configuradas", Colors.GREEN)
    
    # 3. Generar VAPID keys si no existen
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔑 VERIFICANDO VAPID KEYS PARA PUSH NOTIFICATIONS", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    if 'VAPID_PRIVATE_KEY' not in current_env or 'NEXT_PUBLIC_VAPID_PUBLIC_KEY' not in current_env:
        log("Generando nuevas VAPID keys...", Colors.YELLOW)
        
        # Generar VAPID keys usando Node.js
        vapid_cmd = '''
        cd /opt/inmova-app && node -e "
        const webpush = require('web-push');
        const vapidKeys = webpush.generateVAPIDKeys();
        console.log('PUBLIC:' + vapidKeys.publicKey);
        console.log('PRIVATE:' + vapidKeys.privateKey);
        "
        '''
        status, output = exec_cmd(client, vapid_cmd)
        
        if status == 0 and 'PUBLIC:' in output:
            lines = output.split('\n')
            public_key = None
            private_key = None
            
            for line in lines:
                if line.startswith('PUBLIC:'):
                    public_key = line.replace('PUBLIC:', '')
                elif line.startswith('PRIVATE:'):
                    private_key = line.replace('PRIVATE:', '')
            
            if public_key and private_key:
                # Añadir a .env.production
                exec_cmd(client, f"echo 'NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_key}' >> {APP_PATH}/.env.production")
                exec_cmd(client, f"echo 'VAPID_PRIVATE_KEY={private_key}' >> {APP_PATH}/.env.production")
                exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
                
                log(f"✅ VAPID Public Key: {public_key[:30]}...", Colors.GREEN)
                log(f"✅ VAPID Private Key: {private_key[:20]}...", Colors.GREEN)
                
                # Reiniciar PM2
                exec_cmd(client, "pm2 restart inmova-app --update-env")
            else:
                log("⚠️ No se pudieron parsear las VAPID keys", Colors.YELLOW)
        else:
            log(f"⚠️ Error generando VAPID keys: {output}", Colors.YELLOW)
    else:
        log("✅ VAPID keys ya configuradas", Colors.GREEN)
    
    # 4. Resumen final
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📊 RESUMEN FINAL", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    # Leer variables actualizadas
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production")
    updated_env = {}
    for line in output.split('\n'):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key = line.split('=')[0].strip()
            updated_env[key] = True
    
    print("\n📈 Estado de Integraciones:\n")
    
    integrations = {
        "Autenticación (NextAuth)": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
        "Base de Datos (PostgreSQL)": ["DATABASE_URL"],
        "Pagos (Stripe)": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
        "Email (Gmail SMTP)": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
        "Analytics (GA4)": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
        "Storage (AWS S3)": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET_NAME"],
        "SMS (Twilio)": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
        "Monitoreo (Sentry)": ["SENTRY_DSN"],
        "Push Notifications": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
        "IA (Claude/Abacus)": ["ANTHROPIC_API_KEY", "ABACUSAI_API_KEY"],
        "Cache (Redis)": ["REDIS_URL"],
        "Firma Digital (Signaturit)": ["SIGNATURIT_API_KEY"],
    }
    
    for integration, vars_needed in integrations.items():
        configured = sum(1 for v in vars_needed if v in updated_env)
        total = len(vars_needed)
        
        if configured == total:
            status_icon = f"{Colors.GREEN}✅ COMPLETA{Colors.END}"
        elif configured > 0:
            status_icon = f"{Colors.YELLOW}⚠️ PARCIAL ({configured}/{total}){Colors.END}"
        else:
            status_icon = f"{Colors.RED}❌ FALTANTE{Colors.END}"
        
        print(f"  {integration:<35} {status_icon}")
    
    # Variables críticas faltantes
    print(f"\n{Colors.YELLOW}⚠️ Variables aún faltantes (requieren credenciales externas):{Colors.END}\n")
    
    still_missing = []
    for var, category in critical_vars:
        if var not in updated_env:
            still_missing.append((var, category))
            print(f"  ❌ {var} ({category})")
    
    if not still_missing:
        print(f"  {Colors.GREEN}¡Todas las variables críticas están configuradas!{Colors.END}")
    
    # Cerrar conexión
    client.close()
    log("🔐 Conexión cerrada", Colors.BLUE)
    
    print(f"\n{Colors.GREEN}{'='*70}{Colors.END}")
    print(f"{Colors.GREEN}✅ VERIFICACIÓN COMPLETADA{Colors.END}")
    print(f"{Colors.GREEN}{'='*70}{Colors.END}\n")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
