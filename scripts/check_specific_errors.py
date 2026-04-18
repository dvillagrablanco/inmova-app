#!/usr/bin/env python3
import paramiko
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=10)

# Trigger errors and capture
for path in ['notification-templates', 'notification-rules', 'screening', 'comunidades/dashboard', 'reuniones', 'votaciones', 'bi/dashboard', 'estadisticas', 'reports']:
    print(f"\n=== Looking for errors related to /api/{path} ===")
    cmd = f"pm2 logs inmova-app --err --lines 500 --nostream 2>&1 | grep -B 2 -A 30 -i '{path}' | tail -60"
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    if out.strip():
        print(out[:4000])

client.close()
