#!/usr/bin/env python3
"""Verificar estado del deploy"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username="root", password=PASSWORD, timeout=10)

def exec_cmd(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== ESTADO DEL SERVIDOR ===")
print("\n1. PM2 Status:")
print(exec_cmd("pm2 list 2>/dev/null || echo 'PM2 no iniciado'"))

print("\n2. Verificar build:")
print(exec_cmd("ls -la /opt/inmova-app/.next/prerender-manifest.json 2>&1"))

print("\n3. HTTP Status localhost:")
print(exec_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --connect-timeout 5 2>&1"))

print("\n4. Git branch actual:")
print(exec_cmd("cd /opt/inmova-app && git branch --show-current"))

print("\n5. Último commit:")
print(exec_cmd("cd /opt/inmova-app && git log --oneline -3"))

print("\n6. Procesos npm/node:")
print(exec_cmd("pgrep -a 'node|npm' | head -5"))

client.close()
