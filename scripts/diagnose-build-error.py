#!/usr/bin/env python3
"""Diagnosticar error de build en producción"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

print("📋 Ver últimas 100 líneas del error de build:")
print("=" * 80)

stdin, stdout, stderr = client.exec_command(
    f"cd {APP_PATH} && npm run build 2>&1 | tail -100"
)
stdout.channel.recv_exit_status()
output = stdout.read().decode()

print(output)
print("=" * 80)

client.close()
