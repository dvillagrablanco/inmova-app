#!/usr/bin/env python3
"""Check server PM2 logs for errors"""
import paramiko
import sys

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=10)

print("=== PM2 status ===")
out, _ = exec_cmd(client, "pm2 list")
print(out)

print("\n=== Last 200 lines of error log ===")
out, _ = exec_cmd(client, "pm2 logs inmova-app --err --lines 200 --nostream 2>&1 | tail -200")
print(out)

client.close()
