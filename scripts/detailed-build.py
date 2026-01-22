#!/usr/bin/env python3
"""Detailed build debug"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username="root", password=PASSWORD, timeout=30)

print("=" * 70)
print("📋 VERIFICANDO ESTADO DEL BUILD")
print("=" * 70)

# Check what's in .next
stdin, stdout, stderr = client.exec_command(f"ls -la {APP_PATH}/.next/ 2>&1")
stdout.channel.recv_exit_status()
print("\n.next directory contents:")
print(stdout.read().decode())

# Check build errors in log
stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 100 --nostream 2>&1 | tail -80")
stdout.channel.recv_exit_status()
print("\nPM2 Logs (últimas 80 líneas):")
print(stdout.read().decode())

# Try to identify page with error
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && npm run build 2>&1 | grep -i 'error\\|failed\\|warning' | head -30")
stdout.channel.recv_exit_status()
print("\nBuild errors/warnings:")
print(stdout.read().decode())

# Check if there's a previous working .next backup
stdin, stdout, stderr = client.exec_command(f"ls -la /var/backups/inmova/*.next* 2>/dev/null || echo 'No backup found'")
stdout.channel.recv_exit_status()
print("\nBackup de .next:")
print(stdout.read().decode())

# Check git stash for working version
stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && git stash list")
stdout.channel.recv_exit_status()
print("\nGit stash list:")
print(stdout.read().decode())

client.close()
