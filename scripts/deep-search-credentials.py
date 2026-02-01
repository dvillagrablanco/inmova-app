#!/usr/bin/env python3
"""
Script para buscar en profundidad todas las credenciales en el servidor.
Busca en archivos .env, backups, logs, historial, etc.
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import re

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
    print(f"{Colors.MAGENTA}🔍 BÚSQUEDA PROFUNDA DE CREDENCIALES EN SERVIDOR{Colors.END}")
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
    
    # Diccionario para almacenar credenciales encontradas
    found_credentials = {}
    
    # Patrones a buscar
    patterns = {
        "STRIPE": r"(sk_live_[a-zA-Z0-9]+|pk_live_[a-zA-Z0-9]+|rk_live_[a-zA-Z0-9]+|whsec_[a-zA-Z0-9]+)",
        "TWILIO": r"(AC[a-f0-9]{32}|SK[a-f0-9]{32})",
        "SENTRY": r"(https://[a-f0-9]+@[a-z]+\.ingest\.sentry\.io/[0-9]+)",
        "ANTHROPIC": r"(sk-ant-[a-zA-Z0-9_-]+)",
        "OPENAI": r"(sk-[a-zA-Z0-9]{48})",
        "REDIS": r"(redis://[^\s\"']+|rediss://[^\s\"']+)",
        "SIGNATURIT": r"(sig_[a-zA-Z0-9]+)",
        "SENDGRID": r"(SG\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)",
        "MAPBOX": r"(pk\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)",
        "AWS": r"(AKIA[A-Z0-9]{16})",
        "GENERIC_SECRET": r"([a-zA-Z_]+_SECRET_KEY|[a-zA-Z_]+_API_KEY)=([^\s\"']+)",
    }
    
    # 1. Buscar en todos los archivos .env
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📁 1. BUSCANDO EN ARCHIVOS .env Y BACKUPS", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    env_search_paths = [
        f"{APP_PATH}/.env*",
        f"{APP_PATH}/*.env*",
        "/root/.env*",
        "/home/*/.env*",
        f"{APP_PATH}/config/*.env*",
    ]
    
    for path in env_search_paths:
        status, output = exec_cmd(client, f"ls -la {path} 2>/dev/null | head -20")
        if output and "No such file" not in output:
            log(f"Archivos encontrados en {path}:", Colors.GREEN)
            print(output)
            print()
    
    # Leer contenido de todos los .env
    status, env_files = exec_cmd(client, f"find {APP_PATH} -name '*.env*' -o -name '.env*' 2>/dev/null | head -50")
    
    if env_files:
        for env_file in env_files.split('\n'):
            if env_file.strip():
                log(f"Leyendo: {env_file}", Colors.YELLOW)
                status, content = exec_cmd(client, f"cat '{env_file}' 2>/dev/null")
                if content:
                    # Buscar patrones
                    for name, pattern in patterns.items():
                        matches = re.findall(pattern, content, re.IGNORECASE)
                        for match in matches:
                            if isinstance(match, tuple):
                                key, value = match
                                if value and len(value) > 5:
                                    found_credentials[f"{name}_{key}"] = value
                                    log(f"  ✅ Encontrado {name}: {key}={value[:20]}...", Colors.GREEN)
                            else:
                                if match and len(match) > 10:
                                    found_credentials[f"{name}_{match[:15]}"] = match
                                    log(f"  ✅ Encontrado {name}: {match[:30]}...", Colors.GREEN)
    
    # 2. Buscar en historial de bash
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📜 2. BUSCANDO EN HISTORIAL DE BASH", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    history_files = ["/root/.bash_history", "/home/*/.bash_history"]
    
    for hist_path in history_files:
        status, output = exec_cmd(client, f"cat {hist_path} 2>/dev/null | grep -iE '(KEY|SECRET|TOKEN|PASSWORD|STRIPE|TWILIO|SENTRY|ANTHROPIC|REDIS|SIG_)' | head -30")
        if output:
            log(f"Comandos relevantes en {hist_path}:", Colors.YELLOW)
            for line in output.split('\n')[:20]:
                print(f"  {line[:100]}")
                # Buscar patrones
                for name, pattern in patterns.items():
                    matches = re.findall(pattern, line)
                    for match in matches:
                        if isinstance(match, str) and len(match) > 10:
                            found_credentials[f"HIST_{name}"] = match
                            log(f"  ✅ Encontrado en historial: {match[:40]}...", Colors.GREEN)
    
    # 3. Buscar en archivos de configuración de PM2
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("⚙️ 3. BUSCANDO EN CONFIGURACIÓN PM2", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    pm2_files = [
        f"{APP_PATH}/ecosystem.config.js",
        f"{APP_PATH}/pm2.config.js",
        "/root/.pm2/dump.pm2",
        "/root/.pm2/logs/*.log",
    ]
    
    for pm2_file in pm2_files:
        status, output = exec_cmd(client, f"cat {pm2_file} 2>/dev/null | grep -iE '(KEY|SECRET|TOKEN|API)' | head -20")
        if output:
            log(f"Configuración PM2 ({pm2_file}):", Colors.YELLOW)
            for line in output.split('\n')[:10]:
                print(f"  {line[:100]}")
    
    # 4. Buscar en variables de entorno de PM2
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔧 4. VARIABLES DE ENTORNO CARGADAS EN PM2", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, "pm2 env 0 2>/dev/null | grep -iE '(STRIPE|TWILIO|SENTRY|ANTHROPIC|REDIS|SIGNATURIT|SENDGRID|MAPBOX|ABACUS)' | head -30")
    if output:
        log("Variables de entorno en PM2:", Colors.GREEN)
        for line in output.split('\n'):
            if '=' in line:
                key = line.split('=')[0].strip()
                value = '='.join(line.split('=')[1:]).strip()
                if value and len(value) > 5:
                    found_credentials[f"PM2_{key}"] = value
                    # Mostrar valor parcial
                    display_value = value[:25] + "..." if len(value) > 25 else value
                    print(f"  {key}={display_value}")
    
    # 5. Buscar en archivos de logs recientes
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📝 5. BUSCANDO EN LOGS RECIENTES", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    log_search = [
        f"{APP_PATH}/*.log",
        "/var/log/nginx/*.log",
        "/root/.pm2/logs/*.log",
    ]
    
    for log_path in log_search:
        status, output = exec_cmd(client, f"grep -riE '(sk_live|pk_live|whsec_|AC[a-f0-9]{{32}}|sk-ant-|SG\\.)' {log_path} 2>/dev/null | head -10")
        if output:
            log(f"Encontrado en {log_path}:", Colors.YELLOW)
            for line in output.split('\n')[:5]:
                print(f"  {line[:100]}")
    
    # 6. Buscar en archivos package.json y configs
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("📦 6. BUSCANDO EN ARCHIVOS DE CONFIGURACIÓN", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    config_files = [
        f"{APP_PATH}/vercel.json",
        f"{APP_PATH}/next.config.js",
        f"{APP_PATH}/.npmrc",
        f"{APP_PATH}/config/*.json",
        f"{APP_PATH}/config/*.js",
    ]
    
    for config_file in config_files:
        status, output = exec_cmd(client, f"cat {config_file} 2>/dev/null | grep -iE '(KEY|SECRET|TOKEN)' | head -10")
        if output:
            log(f"Config ({config_file}):", Colors.YELLOW)
            print(output[:500])
    
    # 7. Buscar en directorio /etc y otros lugares comunes
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔐 7. BUSCANDO EN DIRECTORIOS DEL SISTEMA", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    system_search = [
        "/etc/environment",
        "/etc/profile.d/*.sh",
        "/root/.profile",
        "/root/.bashrc",
    ]
    
    for sys_file in system_search:
        status, output = exec_cmd(client, f"cat {sys_file} 2>/dev/null | grep -iE '(STRIPE|TWILIO|SENTRY|ANTHROPIC|REDIS|SIGNATURIT)' 2>/dev/null | head -10")
        if output:
            log(f"Encontrado en {sys_file}:", Colors.GREEN)
            print(output)
    
    # 8. Buscar archivos que contengan credenciales específicas
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🔎 8. BÚSQUEDA ESPECÍFICA POR PATRONES", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    specific_searches = {
        "Stripe Secret Key": f"grep -r 'sk_live_' {APP_PATH} --include='*.env*' --include='*.js' --include='*.ts' 2>/dev/null | head -5",
        "Stripe Publishable Key": f"grep -r 'pk_live_' {APP_PATH} --include='*.env*' --include='*.js' --include='*.ts' 2>/dev/null | head -5",
        "Twilio SID": f"grep -r 'AC[a-f0-9]' {APP_PATH} --include='*.env*' 2>/dev/null | head -5",
        "Sentry DSN": f"grep -r 'sentry.io' {APP_PATH} --include='*.env*' 2>/dev/null | head -5",
        "Anthropic Key": f"grep -r 'sk-ant-' {APP_PATH} --include='*.env*' 2>/dev/null | head -5",
        "SendGrid Key": f"grep -r 'SG\\.' {APP_PATH} --include='*.env*' 2>/dev/null | head -5",
        "Redis URL": f"grep -r 'redis://' {APP_PATH} --include='*.env*' 2>/dev/null | head -5",
        "Signaturit": f"grep -r 'SIGNATURIT' {APP_PATH} --include='*.env*' 2>/dev/null | head -5",
    }
    
    for name, cmd in specific_searches.items():
        status, output = exec_cmd(client, cmd)
        if output and "No such file" not in output:
            log(f"✅ {name}:", Colors.GREEN)
            for line in output.split('\n')[:3]:
                # Extraer el valor
                if '=' in line:
                    parts = line.split('=')
                    if len(parts) >= 2:
                        value = '='.join(parts[1:]).strip().strip('"').strip("'")
                        if value and len(value) > 5:
                            found_credentials[name] = value
                            print(f"    {line[:80]}")
    
    # 9. Buscar en archivos comprimidos/backups
    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    log("🗄️ 9. BUSCANDO EN BACKUPS Y ARCHIVOS COMPRIMIDOS", Colors.CYAN)
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    status, output = exec_cmd(client, f"find {APP_PATH} -name '*.backup*' -o -name '*.bak' 2>/dev/null | head -20")
    if output:
        log("Archivos de backup encontrados:", Colors.YELLOW)
        for backup_file in output.split('\n')[:10]:
            if backup_file.strip():
                print(f"  {backup_file}")
                # Leer contenido y buscar credenciales
                status, content = exec_cmd(client, f"cat '{backup_file}' 2>/dev/null | grep -iE '(STRIPE|TWILIO|SENTRY|ANTHROPIC|REDIS|SIGNATURIT)' | head -5")
                if content:
                    for line in content.split('\n'):
                        if '=' in line:
                            key = line.split('=')[0].strip()
                            value = '='.join(line.split('=')[1:]).strip().strip('"').strip("'")
                            if value and len(value) > 10:
                                found_credentials[f"BACKUP_{key}"] = value
                                log(f"    ✅ {key}={value[:30]}...", Colors.GREEN)
    
    # 10. Resumen de credenciales encontradas
    print(f"\n{Colors.MAGENTA}{'='*70}{Colors.END}")
    log("📊 RESUMEN DE CREDENCIALES ENCONTRADAS", Colors.MAGENTA)
    print(f"{Colors.MAGENTA}{'='*70}{Colors.END}\n")
    
    if found_credentials:
        # Agrupar por tipo
        stripe_keys = {k: v for k, v in found_credentials.items() if 'STRIPE' in k.upper() or 'sk_' in v or 'pk_' in v or 'whsec_' in v}
        twilio_keys = {k: v for k, v in found_credentials.items() if 'TWILIO' in k.upper() or v.startswith('AC')}
        sentry_keys = {k: v for k, v in found_credentials.items() if 'SENTRY' in k.upper() or 'sentry.io' in v}
        ai_keys = {k: v for k, v in found_credentials.items() if 'ANTHROPIC' in k.upper() or 'ABACUS' in k.upper() or 'sk-ant' in v}
        redis_keys = {k: v for k, v in found_credentials.items() if 'REDIS' in k.upper() or 'redis://' in v}
        other_keys = {k: v for k, v in found_credentials.items() if k not in stripe_keys and k not in twilio_keys and k not in sentry_keys and k not in ai_keys and k not in redis_keys}
        
        if stripe_keys:
            print(f"\n{Colors.GREEN}💳 STRIPE:{Colors.END}")
            for k, v in stripe_keys.items():
                print(f"  {k}: {v[:40]}...")
        
        if twilio_keys:
            print(f"\n{Colors.GREEN}📱 TWILIO:{Colors.END}")
            for k, v in twilio_keys.items():
                print(f"  {k}: {v[:40]}...")
        
        if sentry_keys:
            print(f"\n{Colors.GREEN}🔍 SENTRY:{Colors.END}")
            for k, v in sentry_keys.items():
                print(f"  {k}: {v[:40]}...")
        
        if ai_keys:
            print(f"\n{Colors.GREEN}🤖 AI (ANTHROPIC/ABACUS):{Colors.END}")
            for k, v in ai_keys.items():
                print(f"  {k}: {v[:40]}...")
        
        if redis_keys:
            print(f"\n{Colors.GREEN}🗄️ REDIS:{Colors.END}")
            for k, v in redis_keys.items():
                print(f"  {k}: {v[:40]}...")
        
        if other_keys:
            print(f"\n{Colors.GREEN}🔧 OTRAS:{Colors.END}")
            for k, v in other_keys.items():
                print(f"  {k}: {v[:40]}...")
    else:
        log("❌ No se encontraron credenciales adicionales", Colors.YELLOW)
    
    # Guardar credenciales encontradas en archivo temporal
    if found_credentials:
        log("\n💾 Guardando credenciales encontradas...", Colors.BLUE)
        creds_content = "\n".join([f"{k}={v}" for k, v in found_credentials.items()])
        exec_cmd(client, f"echo '{creds_content}' > /tmp/found_credentials.txt")
        log("✅ Guardadas en /tmp/found_credentials.txt", Colors.GREEN)
    
    client.close()
    log("\n🔐 Conexión cerrada", Colors.BLUE)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
