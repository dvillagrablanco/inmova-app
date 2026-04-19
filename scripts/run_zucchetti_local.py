#!/usr/bin/env python3
"""Ejecuta sync via endpoint local sin pasar por Cloudflare (no timeout 100s)."""
import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=15)

# Usar el script bcrypt para login + curl con cookies
cmd = """
cd /opt/inmova-app

# Step 1: get csrf
CSRF_RESP=$(curl -s -c /tmp/cookies.txt http://localhost:3000/api/auth/csrf)
CSRF=$(echo "$CSRF_RESP" | grep -oP '"csrfToken":"\\K[^"]+')
echo "CSRF: ${CSRF:0:20}..."

# Step 2: login
LOGIN_RESP=$(curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt \\
  -X POST http://localhost:3000/api/auth/callback/credentials \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  --data-urlencode "csrfToken=$CSRF" \\
  --data-urlencode "email=dvillagra@vidaroinversiones.com" \\
  --data-urlencode "password=Pucela00#" \\
  --data-urlencode "callbackUrl=http://localhost:3000/dashboard" \\
  --data-urlencode "json=true")
echo "Login resp: ${LOGIN_RESP:0:100}"

# Step 3: verify session
SESS=$(curl -s -b /tmp/cookies.txt http://localhost:3000/api/auth/session)
echo "Session: ${SESS:0:200}"

# Step 4: full-sync
echo ""
echo "=== Iniciando full-sync (puede tardar 5-10 min) ==="
START=$(date +%s)
curl -s -b /tmp/cookies.txt \\
  -X POST http://localhost:3000/api/accounting/zucchetti/full-sync \\
  -H 'Content-Type: application/json' \\
  --max-time 600 \\
  -d '{"allGroup":true}' | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    print(json.dumps(data, indent=2)[:3000])
except Exception as e:
    print("Parse error:", e)
    sys.stdin.seek(0)
    print(sys.stdin.read()[:1500])
'
END=$(date +%s)
echo ""
echo "Total: $((END-START)) segundos"
"""

stdin, stdout, stderr = c.exec_command(cmd, timeout=900)
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip():
    print("STDERR:", err[-500:])
c.close()
