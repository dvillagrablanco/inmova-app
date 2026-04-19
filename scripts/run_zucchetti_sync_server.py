#!/usr/bin/env python3
"""Ejecuta full-sync directo en el servidor (saltando Cloudflare)."""
import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# 1) Login para obtener cookies de sesión
print("=== Login ===")
login_cmd = '''
cd /opt/inmova-app
# Obtener csrf
curl -s -c /tmp/cookies.txt http://localhost:3000/api/auth/csrf
echo
# Login
CSRF=$(grep csrf /tmp/cookies.txt 2>/dev/null | tail -1 | awk '{print $7}')
curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt \\
  -X POST http://localhost:3000/api/auth/callback/credentials \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d "csrfToken=${CSRF}&email=dvillagra@vidaroinversiones.com&password=Pucela00%23&callbackUrl=http://localhost:3000/dashboard&json=true"
echo
echo "=== Cookies obtenidas ==="
cat /tmp/cookies.txt | grep -E '(token|session)' | wc -l
'''
stdin, stdout, _ = c.exec_command(login_cmd, timeout=60)
print(stdout.read().decode()[-500:])

# 2) Ejecutar full-sync
print("\n=== Full sync (puede tardar 5-10 min) ===")
sync_cmd = '''
curl -s -b /tmp/cookies.txt \\
  -X POST http://localhost:3000/api/accounting/zucchetti/full-sync \\
  -H 'Content-Type: application/json' \\
  --max-time 600 \\
  -d '{"allGroup":true}' | python3 -m json.tool 2>&1 | head -200
'''
stdin, stdout, stderr = c.exec_command(sync_cmd, timeout=700)
output = stdout.read().decode()
err = stderr.read().decode()
print(output[-3000:])
if err:
    print("STDERR:", err[-500:])

c.close()
