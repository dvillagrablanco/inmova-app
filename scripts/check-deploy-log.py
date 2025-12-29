#!/usr/bin/env python3
import paramiko
import sys

SSH_HOST = "157.180.119.236"
SSH_USER = "root"
SSH_PASS = "xqxAkFdA33j3"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(SSH_HOST, 22, SSH_USER, SSH_PASS, timeout=30)
    
    print("="*80)
    print("LOG DEL DEPLOYMENT")
    print("="*80)
    
    stdin, stdout, stderr = ssh.exec_command("tail -100 /tmp/deploy-final.log 2>/dev/null || tail -100 /tmp/deploy.log 2>/dev/null || echo 'No log found'")
    print(stdout.read().decode('utf-8'))
    
finally:
    ssh.close()
