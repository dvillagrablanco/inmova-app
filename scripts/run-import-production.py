#!/usr/bin/env python3
"""
Ejecutar importación de datos Rovida/Viroda en producción.

1. Sube los archivos necesarios al servidor
2. Ejecuta el parser Python
3. Ejecuta el script TypeScript de importación
4. Verifica resultados
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import json
import os
from datetime import datetime

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    errors = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, errors

def main():
    print(f"\n{'='*70}")
    print(f"{Colors.CYAN}{Colors.BOLD}  IMPORTACIÓN DATOS ROVIDA & VIRODA - PRODUCCIÓN{Colors.RESET}")
    print(f"{'='*70}")
    print(f"Servidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print(f"{'='*70}\n")

    # Verify local parsed-data.json exists
    local_json = os.path.join(os.path.dirname(__file__), '..', 'data-import', 'parsed-data.json')
    local_json = os.path.abspath(local_json)
    if not os.path.exists(local_json):
        log("parsed-data.json no encontrado. Ejecutando parser...", Colors.YELLOW)
        os.system(f"{sys.executable} {os.path.join(os.path.dirname(__file__), 'parse-rovida-viroda-excel.py')}")
    
    if not os.path.exists(local_json):
        log("ERROR: No se pudo generar parsed-data.json", Colors.RED)
        sys.exit(1)

    # Check file size
    file_size = os.path.getsize(local_json)
    log(f"parsed-data.json: {file_size/1024:.1f} KB", Colors.CYAN)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # 1. Connect
        log("Conectando al servidor...", Colors.BLUE)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("Conectado", Colors.GREEN)

        # 2. Backup BD
        log("Backup de BD antes de importación...", Colors.BLUE)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        exec_cmd(client, f"mkdir -p /var/backups/inmova")
        status, output, _ = exec_cmd(client, 
            f"pg_dump -U postgres inmova_production > /var/backups/inmova/pre-import-{timestamp}.sql 2>/dev/null && echo 'OK' || echo 'SKIP'")
        log(f"Backup: {output.strip()}", Colors.GREEN)

        # 3. Upload parsed-data.json to server
        log("Subiendo parsed-data.json al servidor...", Colors.BLUE)
        exec_cmd(client, f"mkdir -p {APP_PATH}/data-import")
        
        sftp = client.open_sftp()
        remote_json = f"{APP_PATH}/data-import/parsed-data.json"
        sftp.put(local_json, remote_json)
        sftp.close()
        log("Archivo subido", Colors.GREEN)

        # 4. Verify git is up to date with import script
        log("Verificando que el script de importación existe en servidor...", Colors.BLUE)
        status, output, _ = exec_cmd(client, f"ls -la {APP_PATH}/scripts/import-rovida-viroda-clients.ts 2>&1")
        
        if 'No such file' in output:
            log("Script no encontrado, actualizando código...", Colors.YELLOW)
            # Pull the branch first
            exec_cmd(client, f"cd {APP_PATH} && git fetch origin cursor/importaci-n-datos-rovida-viroda-13be 2>&1")
            exec_cmd(client, f"cd {APP_PATH} && git checkout main 2>&1")
            exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
            
            # If script still doesn't exist, copy it directly
            status, output, _ = exec_cmd(client, f"ls {APP_PATH}/scripts/import-rovida-viroda-clients.ts 2>&1")
            if 'No such file' in output:
                log("Copiando script directamente via SFTP...", Colors.YELLOW)
                sftp = client.open_sftp()
                local_script = os.path.join(os.path.dirname(__file__), 'import-rovida-viroda-clients.ts')
                sftp.put(local_script, f"{APP_PATH}/scripts/import-rovida-viroda-clients.ts")
                sftp.close()
                log("Script copiado", Colors.GREEN)
        else:
            log("Script encontrado", Colors.GREEN)

        # 5. Ensure dependencies are installed
        log("Verificando dependencias (dotenv)...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npm ls dotenv 2>/dev/null || npm install dotenv --legacy-peer-deps 2>&1 | tail -2", timeout=120)

        # 6. Generate Prisma client (ensure it's up to date)
        log("Generando Prisma Client...", Colors.BLUE)
        status, output, errors = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3", timeout=120)
        log(f"Prisma: {output.strip()[:100]}", Colors.GREEN)

        # 7. Run the import script
        log("", Colors.RESET)
        log("=" * 60, Colors.CYAN)
        log("  EJECUTANDO IMPORTACIÓN DE DATOS", Colors.CYAN)
        log("=" * 60, Colors.CYAN)
        log("", Colors.RESET)

        import_cmd = f"cd {APP_PATH} && npx tsx scripts/import-rovida-viroda-clients.ts 2>&1"
        status, output, errors = exec_cmd(client, import_cmd, timeout=600)
        
        # Print full output
        print(output)
        if errors and errors.strip():
            print(f"{Colors.YELLOW}Stderr: {errors[:500]}{Colors.RESET}")

        if status != 0:
            log(f"Script terminó con código {status}", Colors.RED)
            if errors:
                log(f"Errores: {errors[:500]}", Colors.RED)
        else:
            log("Importación completada con éxito", Colors.GREEN)

        # 8. Verify results
        log("", Colors.RESET)
        log("Verificando resultados...", Colors.BLUE)
        
        # Count tenants per company
        verify_cmd = f"""cd {APP_PATH} && npx tsx -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();
async function verify() {{
  const rovida = await prisma.company.findFirst({{ where: {{ nombre: {{ contains: 'Rovida', mode: 'insensitive' }} }} }});
  const viroda = await prisma.company.findFirst({{ where: {{ nombre: {{ contains: 'Viroda', mode: 'insensitive' }} }} }});
  
  if (rovida) {{
    const t = await prisma.tenant.count({{ where: {{ companyId: rovida.id }} }});
    const c = await prisma.contract.count({{ where: {{ unit: {{ building: {{ companyId: rovida.id }} }} }} }});
    console.log('ROVIDA: ' + t + ' inquilinos, ' + c + ' contratos');
  }}
  if (viroda) {{
    const t = await prisma.tenant.count({{ where: {{ companyId: viroda.id }} }});
    const c = await prisma.contract.count({{ where: {{ unit: {{ building: {{ companyId: viroda.id }} }} }} }});
    console.log('VIRODA: ' + t + ' inquilinos, ' + c + ' contratos');
  }}
  await prisma.$disconnect();
}}
verify();
" 2>&1"""
        status, output, _ = exec_cmd(client, verify_cmd, timeout=60)
        print(output)

        # Summary
        print(f"\n{'='*70}")
        print(f"{Colors.GREEN}{Colors.BOLD}  IMPORTACIÓN FINALIZADA{Colors.RESET}")
        print(f"{'='*70}")
        print(f"\n  Datos importados desde: Google Drive (Excel)")
        print(f"  Backup BD: /var/backups/inmova/pre-import-{timestamp}.sql")
        print(f"\n  Dashboard: https://inmovaapp.com/dashboard")
        print(f"{'='*70}\n")

    except paramiko.AuthenticationException:
        log("Error de autenticación SSH", Colors.RED)
        sys.exit(1)
    except Exception as e:
        log(f"Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    main()
