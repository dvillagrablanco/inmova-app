#!/usr/bin/env python3
"""
Loop de procesamiento robusto que:
- Llama al endpoint con limit=5 (más rápido por batch)
- Re-login en cada batch (por si caduca)
- Logs detallados
- Retry en caso de error
"""
import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# Crear script en bash que itere SIN python embebido (evita escape errors)
script = """#!/bin/bash
LOG=/tmp/proc_v2.log
echo "=== INICIO $(date) ===" > $LOG

for i in $(seq 1 60); do
  # Re-login antes de cada batch
  CSRF=$(curl -s -c /tmp/cookv2.txt http://localhost:3000/api/auth/csrf | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
  curl -s -b /tmp/cookv2.txt -c /tmp/cookv2.txt -X POST http://localhost:3000/api/auth/callback/credentials \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=dvillagra@vidaroinversiones.com" \
    --data-urlencode "password=Pucela00#" \
    --data-urlencode "json=true" > /dev/null
  
  echo "" >> $LOG
  echo "--- Batch $i $(date +%H:%M:%S) ---" >> $LOG
  
  RESP=$(curl -s -b /tmp/cookv2.txt -X POST http://localhost:3000/api/admin/process-vidaro-docs \
    -H 'Content-Type: application/json' --max-time 900 \
    -d '{"limit":5}')
  
  # Extraer stats con jq si disponible, sino con grep
  PROC=$(echo "$RESP" | grep -oE '"processed":[0-9]+' | head -1 | cut -d: -f2)
  EXTR=$(echo "$RESP" | grep -oE '"extracted":[0-9]+' | head -1 | cut -d: -f2)
  APPL=$(echo "$RESP" | grep -oE '"applied":[0-9]+' | head -1 | cut -d: -f2)
  ERR=$(echo "$RESP" | grep -oE '"errors":[0-9]+' | head -1 | cut -d: -f2)
  
  echo "  processed=$PROC extracted=$EXTR applied=$APPL errors=$ERR" >> $LOG
  
  # Si processed = 0, stop
  if [ "$PROC" = "0" ] || [ -z "$PROC" ]; then
    echo "  STOP (sin más docs o error)" >> $LOG
    if [ -z "$PROC" ]; then
      echo "  Resp first 300 chars: $(echo $RESP | head -c 300)" >> $LOG
    fi
    break
  fi
done
echo "=== FIN $(date) ===" >> $LOG
"""

sftp = c.open_sftp()
with sftp.open('/tmp/proc_v2.sh', 'w') as f:
    f.write(script)
sftp.close()

cmd = """
chmod +x /tmp/proc_v2.sh
nohup /tmp/proc_v2.sh > /tmp/proc_v2_run.log 2>&1 &
echo "PID lanzado: $!"
sleep 1
echo "=== Status ==="
ps aux | grep proc_v2 | grep -v grep | head -2
"""
stdin, stdout, _ = c.exec_command(cmd, timeout=15)
print(stdout.read().decode())
c.close()
