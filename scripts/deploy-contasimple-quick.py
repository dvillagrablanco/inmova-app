#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

print('=' * 70, flush=True)
print('🚀 DEPLOYMENT: INTEGRACIÓN DE CONTASIMPLE', flush=True)
print('=' * 70, flush=True)
print(f'Servidor: {SERVER_IP}', flush=True)
print(f'Path: {APP_PATH}', flush=True)
print('=' * 70, flush=True)

print('\n🔐 Conectando...', flush=True)
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    print('✅ Conectado', flush=True)
except Exception as e:
    print(f'❌ Error: {e}', flush=True)
    sys.exit(1)

def exec_cmd(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return (exit_code, out, err)

# Git pull
print('\n📥 Git pull...', flush=True)
exit_code, out, err = exec_cmd(f'cd {APP_PATH} && git pull origin main')
if exit_code == 0:
    print('✅ Código actualizado', flush=True)
else:
    print(f'❌ Error: {err}', flush=True)
    sys.exit(1)

# Dependencies
print('\n📦 Instalando dependencias...', flush=True)
exit_code, out, err = exec_cmd(f'cd {APP_PATH} && npm install', timeout=600)
if exit_code == 0:
    print('✅ Dependencias instaladas', flush=True)
else:
    print(f'❌ Error: {err[:500]}', flush=True)
    sys.exit(1)

# Prisma generate
print('\n🔧 Prisma generate...', flush=True)
exit_code, out, err = exec_cmd(f'cd {APP_PATH} && npx prisma generate', timeout=120)
if exit_code == 0:
    print('✅ Prisma generate OK', flush=True)
else:
    print(f'⚠️  Warning: {err[:300]}', flush=True)

# Prisma migrate
print('\n📊 Prisma migrate deploy...', flush=True)
exit_code, out, err = exec_cmd(f'cd {APP_PATH} && npx prisma migrate deploy', timeout=300)
if exit_code == 0:
    print('✅ Migraciones aplicadas', flush=True)
    print(out[:300], flush=True)
else:
    print(f'⚠️  Warning: {err[:300]}', flush=True)

# Build
print('\n🏗️  Building...', flush=True)
exit_code, out, err = exec_cmd(f'cd {APP_PATH} && npm run build', timeout=900)
if exit_code == 0:
    print('✅ Build completado', flush=True)
else:
    print(f'❌ Error: {err[:500]}', flush=True)
    sys.exit(1)

# PM2 restart
print('\n♻️  PM2 restart...', flush=True)
exit_code, out, err = exec_cmd('pm2 restart inmova-app --update-env')
print('✅ PM2 restarted', flush=True)

print('\n⏳ Esperando warm-up (15s)...', flush=True)
time.sleep(15)

# Health check
print('\n🏥 Health check...', flush=True)
exit_code, out, err = exec_cmd('curl -s http://localhost:3000/api/health')
if '"status":"ok"' in out or '"status": "ok"' in out:
    print('✅ Health check OK', flush=True)
else:
    print(f'⚠️  Health check response: {out[:200]}', flush=True)

print('\n' + '=' * 70, flush=True)
print('✅ DEPLOYMENT COMPLETADO', flush=True)
print('=' * 70, flush=True)
print('\nURL: https://inmovaapp.com', flush=True)
print('Health: https://inmovaapp.com/api/health', flush=True)

client.close()
