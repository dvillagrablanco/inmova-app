#!/usr/bin/env python3
"""Ejecuta reclasificación de documentos en producción"""
import sys
import time
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_DIR = '/opt/inmova-app'

def run(client, cmd, timeout=120):
    print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n'):
            print(f"    {line}")
    if err and exit_status != 0:
        for line in err.split('\n')[:10]:
            print(f"    [ERR] {line}")
    return exit_status, out

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)

    try:
        # Pull latest (el script ya está en el repo)
        print("1. Git pull...")
        run(client, f"cd {APP_DIR} && git pull origin cursor/valoraci-n-ia-integraci-n-plataformas-f51d", timeout=60)

        # Ejecutar script de reclasificación
        print("\n2. Ejecutando reclasificación de documentos...")
        status, out = run(client, f"cd {APP_DIR} && source .env.production 2>/dev/null; export $(cat .env.production 2>/dev/null | grep -v '^#' | xargs) 2>/dev/null; npx tsx scripts/reclassify-unit-documents.ts", timeout=120)

        if 'completada' in out.lower() or 'limpio' in out.lower():
            print("\nReclasificación completada OK.")
        else:
            print(f"\nResultado: exit={status}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == '__main__':
    main()
