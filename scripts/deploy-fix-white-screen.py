#!/usr/bin/env python3
"""Deploy Fix Pantalla Blanca"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

def execute_command(ssh, command, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8')
    return {'exit_status': exit_status, 'output': output}

def main():
    print("🔧 Deploying fix para pantalla blanca...\n")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    try:
        # Upload WhiteScreenMonitor actualizado
        print("1. Subiendo WhiteScreenMonitor.tsx...")
        sftp = ssh.open_sftp()
        sftp.put(
            '/workspace/components/WhiteScreenMonitor.tsx',
            '/opt/inmova-app/components/WhiteScreenMonitor.tsx'
        )
        sftp.close()
        print("  ✅ Archivo subido\n")
        
        # Restart PM2
        print("2. Reiniciando aplicación...")
        execute_command(ssh, "pm2 restart inmova-app")
        print("  ✅ App reiniciada\n")
        
        # Wait
        import time
        print("3. Esperando 10 segundos...")
        time.sleep(10)
        
        # Ver logs
        print("\n4. Logs recientes:")
        result = execute_command(ssh, "pm2 logs inmova-app --lines 20 --nostream")
        print(result['output'][-1000:])
        
        print("\n✅ Deploy completado")
        print("\nPrueba en: http://157.180.119.236/landing")
        print("Revisa console del navegador para ver logs del monitor\n")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
