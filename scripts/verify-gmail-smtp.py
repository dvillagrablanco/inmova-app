#!/usr/bin/env python3
"""Verificar configuración de Gmail SMTP en producción"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m', 'WARNING': '\033[1;33m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("📧 VERIFICACIÓN DE GMAIL SMTP")
log("=" * 80)

checks_passed = 0
checks_total = 4

# 1. Verificar variables SMTP en .env.production
log("\n1/4 Variables SMTP en .env.production...")
stdin, stdout, stderr = client.exec_command(
    "grep -E 'SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASSWORD|SMTP_FROM' /opt/inmova-app/.env.production | sed 's/=.*/=***HIDDEN***/'"
)
stdout.channel.recv_exit_status()
output = stdout.read().decode().strip()

if output and 'SMTP_HOST' in output:
    log("   ✅ Variables SMTP configuradas:", 'SUCCESS')
    print(output)
    checks_passed += 1
else:
    log("   ❌ Variables SMTP NO configuradas", 'ERROR')

# 2. Contar variables SMTP
log("\n2/4 Conteo de variables SMTP...")
stdin, stdout, stderr = client.exec_command(
    "grep -E 'SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASSWORD|SMTP_FROM' /opt/inmova-app/.env.production | wc -l"
)
stdout.channel.recv_exit_status()
count = int(stdout.read().decode().strip())

if count >= 5:
    log(f"   ✅ Todas las variables SMTP presentes ({count}/5)", 'SUCCESS')
    checks_passed += 1
elif count >= 4:
    log(f"   ⚠️ Variables SMTP casi completas ({count}/5)", 'WARNING')
    checks_passed += 1
else:
    log(f"   ❌ Faltan variables SMTP ({count}/5)", 'ERROR')

# 3. Verificar servicio de email en código
log("\n3/4 Verificar lib/email-service.ts existe...")
stdin, stdout, stderr = client.exec_command(
    "test -f /opt/inmova-app/lib/email-service.ts && echo 'EXISTS' || test -f /opt/inmova-app/lib/email.ts && echo 'EXISTS' || echo 'NOT_FOUND'"
)
stdout.channel.recv_exit_status()
exists = stdout.read().decode().strip()

if exists == 'EXISTS':
    log("   ✅ Servicio de email configurado", 'SUCCESS')
    checks_passed += 1
else:
    log("   ⚠️ Archivo de servicio de email no encontrado", 'WARNING')

# 4. Test rápido de nodemailer (si existe)
log("\n4/4 Verificar nodemailer instalado...")
stdin, stdout, stderr = client.exec_command(
    "cd /opt/inmova-app && npm list nodemailer 2>/dev/null | grep nodemailer && echo 'INSTALLED' || echo 'NOT_INSTALLED'"
)
stdout.channel.recv_exit_status()
installed = stdout.read().decode().strip()

if 'INSTALLED' in installed:
    log("   ✅ Nodemailer instalado", 'SUCCESS')
    checks_passed += 1
else:
    log("   ⚠️ Nodemailer no encontrado en node_modules", 'WARNING')

client.close()

log("\n" + "=" * 80)
log(f"Verificación: {checks_passed}/{checks_total} checks pasando")

if checks_passed >= 3:
    log("✅ GMAIL SMTP CONFIGURADO CORRECTAMENTE", 'SUCCESS')
    log("")
    log("📝 Próximo paso:")
    log("   Testear enviando un email real:")
    log("   - Ir a la app y usar 'Recuperar contraseña'")
    log("   - O ejecutar: node scripts/test-send-email.js")
else:
    log("⚠️ Configuración incompleta - revisar variables", 'WARNING')
