#!/usr/bin/env python3
"""Lanza el procesamiento en BACKGROUND en el servidor (nohup) y desconecta."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# Crear script bash en el servidor que itera batches
script = """#!/bin/bash
cd /tmp

# Login (cookie persistente)
CSRF=$(curl -s -c /tmp/proc_bg.txt http://localhost:3000/api/auth/csrf | python3 -c 'import json,sys; print(json.load(sys.stdin)["csrfToken"])')
curl -s -b /tmp/proc_bg.txt -c /tmp/proc_bg.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=dvillagra@vidaroinversiones.com" \
  --data-urlencode "password=Pucela00#" \
  --data-urlencode "json=true" > /dev/null

LOG=/tmp/process_vidaro.log
echo "=== INICIO $(date) ===" > $LOG

TOTAL_PROC=0
TOTAL_APPL=0
for i in $(seq 1 30); do
  echo "--- Batch $i ---" >> $LOG
  RESP=$(curl -s -b /tmp/proc_bg.txt -X POST http://localhost:3000/api/admin/process-vidaro-docs \
    -H 'Content-Type: application/json' --max-time 1500 \
    -d '{"limit":10}')
  echo "$RESP" | python3 -c '
import json, sys
try:
    d=json.load(sys.stdin)
    if d.get("success"):
        print(f"  processed={d[\"processed\"]} extracted={d[\"extracted\"]} applied={d[\"applied\"]} errors={d[\"errors\"]}")
        if d["processed"] == 0:
            print("STOP")
            sys.exit(99)
    else:
        print(f"  error: {d.get(\"error\")}")
except Exception as e:
    print(f"  parse error: {e}")
' >> $LOG 2>&1
  STATUS=$?
  if [ $STATUS -eq 99 ]; then
    echo "Sin más documentos. FIN." >> $LOG
    break
  fi
  
  # Re-login cada 10 batches por si caduca
  if [ $((i % 10)) -eq 0 ]; then
    CSRF=$(curl -s -c /tmp/proc_bg.txt http://localhost:3000/api/auth/csrf | python3 -c 'import json,sys; print(json.load(sys.stdin)["csrfToken"])')
    curl -s -b /tmp/proc_bg.txt -c /tmp/proc_bg.txt -X POST http://localhost:3000/api/auth/callback/credentials \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      --data-urlencode "csrfToken=$CSRF" \
      --data-urlencode "email=dvillagra@vidaroinversiones.com" \
      --data-urlencode "password=Pucela00#" \
      --data-urlencode "json=true" > /dev/null
  fi
done
echo "=== FIN $(date) ===" >> $LOG
"""

# Subir el script
sftp = c.open_sftp()
with sftp.open('/tmp/run_proc_vidaro.sh', 'w') as f:
    f.write(script)
sftp.close()

# Lanzar en background
cmd = """
chmod +x /tmp/run_proc_vidaro.sh
nohup /tmp/run_proc_vidaro.sh > /tmp/process_vidaro_run.log 2>&1 &
echo "PID: $!"
sleep 2
tail -5 /tmp/process_vidaro.log 2>/dev/null
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=15)
print(stdout.read().decode())
c.close()
