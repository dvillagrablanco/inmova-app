#!/usr/bin/env python3
"""Test SSH connection"""

import sys
import os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

print(f"Testing connection to {SERVER_IP}...")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Connected successfully!")
    
    stdin, stdout, stderr = client.exec_command('hostname && uptime')
    print("\nServer info:")
    print(stdout.read().decode())
    
    client.close()
    print("✅ Test completed")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
