#!/usr/bin/env python3
"""Verificación post-deployment"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

def log(message):
    print(message)

def execute_command(ssh, command):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=15)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    log("🔍 Verificando deployment...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        
        # PM2 status
        log("📊 PM2 Status:")
        status, output = execute_command(client, "pm2 list")
        print(output)
        
        # Logs recientes
        log("\n📝 Últimos logs:")
        status, output = execute_command(client, "pm2 logs inmova-app --lines 30 --nostream")
        print(output[:1000])
        
        # Health check
        log("\n🏥 Health Check:")
        for i in range(3):
            status, output = execute_command(client, "curl -s http://localhost:3000/api/health")
            if 'ok' in output.lower() or 'status' in output.lower():
                log(f"✅ Health check OK: {output[:100]}")
                break
            else:
                log(f"Intento {i+1}/3: {output[:100]}")
                time.sleep(5)
        
        # Test de login page
        log("\n🔐 Test Login Page:")
        status, output = execute_command(client, "curl -s http://localhost:3000/login | head -10")
        if '<html' in output.lower():
            log("✅ Login page responde")
        else:
            log(f"⚠️  Respuesta: {output[:200]}")
        
        # Puerto
        log("\n🔌 Puerto 3000:")
        status, output = execute_command(client, "ss -tlnp | grep :3000")
        print(output)
        
        log("\n✅ Verificación completada")
        
    except Exception as e:
        log(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    main()
