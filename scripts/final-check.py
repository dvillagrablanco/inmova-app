#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

print("Conectando...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)

print("\n=== Health Check ===")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
print(stdout.read().decode())

print("\n=== Login Page ===")
stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login")
print(f"Status: {stdout.read().decode()}")

print("\n=== Users API (debe requerir auth) ===")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/users")
print(stdout.read().decode()[:500])

print("\n=== PM2 Status ===")
stdin, stdout, stderr = client.exec_command("pm2 status")
print(stdout.read().decode())

print("\n=== Nginx Status ===")
stdin, stdout, stderr = client.exec_command("systemctl status nginx | head -10")
print(stdout.read().decode())

client.close()
print("\n✅ Verificación completada")
