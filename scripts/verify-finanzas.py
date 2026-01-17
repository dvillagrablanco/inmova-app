#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

routes = [
    '/finanzas',
    '/finanzas/conciliacion',
    '/admin/ai-agents',
    '/open-banking',
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username='root', password=PASSWORD, timeout=30)

print("\n🔍 Verificando nuevas rutas:\n")
for route in routes:
    stdin, stdout, stderr = client.exec_command(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}")
    stdout.channel.recv_exit_status()
    code = stdout.read().decode().strip()
    status = "✅" if code == "200" else "❌"
    print(f"{status} {route} -> {code}")

client.close()
print()
