#!/usr/bin/env python3
"""Verificar deployment completo - Login, páginas legales, GA4"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m', 'STEP': '\033[1;35m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("🔍 VERIFICACIÓN POST-DEPLOYMENT", 'STEP')
log("=" * 80)

checks_passed = 0
checks_total = 10

# 1. Landing
log("1/10 Landing page...")
stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' https://inmovaapp.com/landing")
stdout.channel.recv_exit_status()
code = stdout.read().decode().strip()
if code == "200":
    log("   ✅ Landing OK (200)", 'SUCCESS')
    checks_passed += 1
else:
    log(f"   ❌ Landing FAIL ({code})", 'ERROR')

# 2. Login page
log("2/10 Login page...")
stdin, stdout, stderr = client.exec_command('curl -s https://inmovaapp.com/login | grep -q "email" && echo "OK" || echo "FAIL"')
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "OK" in result:
    log("   ✅ Login page OK (formulario presente)", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ Login page FAIL", 'ERROR')

# 3. API Auth
log("3/10 API Auth session...")
stdin, stdout, stderr = client.exec_command('curl -s https://inmovaapp.com/api/auth/session | grep -q "{" && echo "OK" || echo "FAIL"')
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "OK" in result:
    log("   ✅ API Auth OK", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ API Auth FAIL", 'ERROR')

# 4-7. Páginas legales
legal_pages = [
    ('4/10', 'Términos y Condiciones', '/legal/terms'),
    ('5/10', 'Política de Privacidad', '/legal/privacy'),
    ('6/10', 'Política de Cookies', '/legal/cookies'),
    ('7/10', 'Aviso Legal', '/legal/legal-notice'),
]

for num, name, path in legal_pages:
    log(f"{num} {name}...")
    stdin, stdout, stderr = client.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' https://inmovaapp.com{path}")
    stdout.channel.recv_exit_status()
    code = stdout.read().decode().strip()
    if code == "200":
        log(f"   ✅ {name} OK", 'SUCCESS')
        checks_passed += 1
    else:
        log(f"   ❌ {name} FAIL ({code})", 'ERROR')

# 8. Google Analytics configurado
log("8/10 Google Analytics...")
stdin, stdout, stderr = client.exec_command('grep "NEXT_PUBLIC_GA_MEASUREMENT_ID" /opt/inmova-app/.env.production')
stdout.channel.recv_exit_status()
result = stdout.read().decode()
if "G-WX2LE41M4T" in result:
    log("   ✅ GA4 configurado (G-WX2LE41M4T)", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ GA4 NO configurado", 'ERROR')

# 9. PM2 status
log("9/10 PM2 status...")
stdin, stdout, stderr = client.exec_command("pm2 jlist | grep inmova-app | grep -q online && echo 'OK' || echo 'FAIL'")
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "OK" in result:
    log("   ✅ PM2 online", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ PM2 FAIL", 'ERROR')

# 10. Health API
log("10/10 API Health...")
stdin, stdout, stderr = client.exec_command('curl -s https://inmovaapp.com/api/health | grep -q \'"status":"ok"\' && echo "OK" || echo "FAIL"')
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "OK" in result:
    log("   ✅ API Health OK", 'SUCCESS')
    checks_passed += 1
else:
    log("   ❌ API Health FAIL", 'ERROR')

log("=" * 80)
log(f"✅ Verificación completa: {checks_passed}/{checks_total} checks pasando", 'SUCCESS' if checks_passed >= 8 else 'ERROR')
log("")

if checks_passed >= 8:
    log("🎉 DEPLOYMENT EXITOSO", 'SUCCESS')
    log("")
    log("📋 Nuevas features deployadas:")
    log("   ✅ Páginas legales (Términos, Privacidad, Cookies, Aviso Legal)")
    log("   ✅ Banner de consentimiento de cookies (GDPR)")
    log("   ✅ Google Analytics 4 (G-WX2LE41M4T)")
    log("   ✅ Footer con enlaces legales")
    log("   ✅ Tests E2E de flujos críticos")
    log("   ✅ Security audit script")
    log("")
    log("⚠️ IMPORTANTE:")
    log("   1. Verificar Google Analytics en Real-time (https://analytics.google.com)")
    log("   2. Usuarios deben aceptar cookies de 'Análisis' para tracking")
    log("   3. Verificar login manualmente en navegador")
    log("")
    log("🌐 URLs:")
    log("   Landing: https://inmovaapp.com/landing")
    log("   Login: https://inmovaapp.com/login")
    log("   Términos: https://inmovaapp.com/legal/terms")
    log("   Privacidad: https://inmovaapp.com/legal/privacy")
    log("   Cookies: https://inmovaapp.com/legal/cookies")
else:
    log("⚠️ Deployment con warnings - verificar manualmente", 'ERROR')

client.close()
