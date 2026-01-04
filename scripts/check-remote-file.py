#!/usr/bin/env python3
import sys
import os

home_dir = os.path.expanduser('~')
sys.path.insert(0, f'{home_dir}/.local/lib/python3.12/site-packages')

import paramiko

HOST = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=10)

# Leer commit actual
stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && git log --oneline -1")
print("Commit actual en servidor:")
print(stdout.read().decode())

# Leer líneas específicas del archivo
stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && sed -n '269,275p' app/incidencias/page.tsx")
print("\nLíneas 269-275 de app/incidencias/page.tsx:")
print(stdout.read().decode())

# Verificar sintaxis con tsc
stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && npx tsc --noEmit app/incidencias/page.tsx 2>&1 | head -20")
print("\nVerificación TypeScript:")
print(stdout.read().decode())

client.close()
