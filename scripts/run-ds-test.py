#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

# Pull and run test
stdin, stdout, stderr = c.exec_command(
    "cd /opt/inmova-app && git pull origin main 2>/dev/null && node scripts/test-ds-envelope.js 2>&1",
    timeout=60
)
stdout.channel.recv_exit_status()
print(stdout.read().decode('utf-8'))
c.close()
