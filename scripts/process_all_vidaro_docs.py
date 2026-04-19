#!/usr/bin/env python3
"""
Procesa TODOS los documentos PDF del grupo Vidaro en S3 en lotes.
Llama al endpoint /api/admin/process-vidaro-docs en bucle hasta agotar.
"""
import paramiko
import time
import sys

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# Login
login_cmd = """
CSRF=$(curl -s -c /tmp/proc.txt http://localhost:3000/api/auth/csrf | python3 -c 'import json,sys; print(json.load(sys.stdin)["csrfToken"])')
curl -s -b /tmp/proc.txt -c /tmp/proc.txt -X POST http://localhost:3000/api/auth/callback/credentials \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  --data-urlencode "csrfToken=$CSRF" \\
  --data-urlencode "email=dvillagra@vidaroinversiones.com" \\
  --data-urlencode "password=Pucela00#" \\
  --data-urlencode "json=true" > /dev/null
echo "OK"
"""
stdin, stdout, _ = c.exec_command(login_cmd, timeout=30)
print(stdout.read().decode())

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 15
MAX_BATCHES = int(sys.argv[2]) if len(sys.argv) > 2 else 5

total_extracted = 0
total_applied = 0
total_errors = 0
total_processed = 0

for i in range(MAX_BATCHES):
    print(f"\n=== BATCH {i+1}/{MAX_BATCHES} (limit={BATCH}) ===")
    t0 = time.time()
    cmd = f"""
curl -s -b /tmp/proc.txt -X POST http://localhost:3000/api/admin/process-vidaro-docs \\
  -H 'Content-Type: application/json' --max-time 1200 \\
  -d '{{"limit":{BATCH}}}' | python3 -c '
import json, sys
try:
    d=json.load(sys.stdin)
    if d.get("success"):
        print(f"  processed={{d[\\"processed\\"]}}, extracted={{d[\\"extracted\\"]}}, applied={{d[\\"applied\\"]}}, errors={{d[\\"errors\\"]}}")
        # Sample resultados aplicados
        for r in (d.get("results") or [])[:5]:
            if r.get("status") == "applied":
                print(f"    APPLIED [{{r[\\"docType\\"]}}] {{r[\\"filename\\"][:50]}} -> {{r[\\"appliedTo\\"]}}")
    else:
        print(f"  ERROR: {{d.get(\\"error\\", \\"unknown\\")}}")
except Exception as e:
    print(f"  parse error: {{e}}")
'
"""
    stdin, stdout, _ = c.exec_command(cmd, timeout=1500)
    output = stdout.read().decode()
    print(output)
    elapsed = time.time() - t0
    print(f"  duración: {elapsed:.0f}s")
    
    # Parsear stats
    import re
    m = re.search(r'processed=(\d+).*extracted=(\d+).*applied=(\d+).*errors=(\d+)', output)
    if m:
        proc, extr, appl, err = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
        total_processed += proc
        total_extracted += extr
        total_applied += appl
        total_errors += err
        if proc == 0:
            print("\nSin más documentos. STOP.")
            break

print(f"\n=== TOTAL ===")
print(f"  Procesados: {total_processed}")
print(f"  Extraídos: {total_extracted}")
print(f"  Aplicados: {total_applied}")
print(f"  Errores: {total_errors}")

c.close()
