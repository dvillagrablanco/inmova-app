#!/usr/bin/env python3
"""Deploy to production server via SSH (Paramiko)"""
import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_DIR = '/opt/inmova-app'

def run(client, cmd, timeout=300):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[-20:]:
            print(f'  {line}')
    if err:
        for line in err.split('\n')[-10:]:
            print(f'  [err] {line}')
    print(f'  exit: {exit_code}')
    return exit_code, out, err

def main():
    print(f'Connecting to {SERVER}...')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
    print('Connected.\n')

    # 1. Git pull
    print('=' * 60)
    print('STEP 1: git pull origin main')
    print('=' * 60)
    code, out, _ = run(client, f'cd {APP_DIR} && git pull origin main', timeout=60)
    if code != 0:
        print('ERROR: git pull failed')
        client.close()
        sys.exit(1)

    # 2. Prisma migrate deploy
    print('\n' + '=' * 60)
    print('STEP 2: npx prisma migrate deploy')
    print('=' * 60)
    code, out, _ = run(client, f'cd {APP_DIR} && npx prisma migrate deploy', timeout=120)

    # 3. Prisma generate (ensure client is up to date)
    print('\n' + '=' * 60)
    print('STEP 3: npx prisma generate')
    print('=' * 60)
    code, out, _ = run(client, f'cd {APP_DIR} && npx prisma generate', timeout=60)

    # 4. npm run build
    print('\n' + '=' * 60)
    print('STEP 4: npm run build')
    print('=' * 60)
    code, out, _ = run(client, f'cd {APP_DIR} && npm run build', timeout=600)
    if code != 0:
        print('WARNING: build may have failed, checking...')

    # 5. PM2 reload
    print('\n' + '=' * 60)
    print('STEP 5: pm2 reload inmova-app')
    print('=' * 60)
    code, out, _ = run(client, 'pm2 reload inmova-app', timeout=30)

    # 6. Wait for warm-up
    print('\nWaiting 15s for warm-up...')
    time.sleep(15)

    # 7. Health check
    print('\n' + '=' * 60)
    print('STEP 6: Health check')
    print('=' * 60)
    code, out, _ = run(client, 'curl -s http://localhost:3000/api/health', timeout=15)
    
    if 'ok' in out.lower() or '"status"' in out:
        print('\n' + '=' * 60)
        print('DEPLOY SUCCESS')
        print('=' * 60)
    else:
        print('\n' + '=' * 60)
        print('WARNING: Health check may have issues')
        print('=' * 60)

    # Show PM2 status
    print('\nPM2 Status:')
    run(client, 'pm2 status', timeout=10)

    client.close()
    print('\nDone.')

if __name__ == '__main__':
    main()
