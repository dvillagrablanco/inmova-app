#!/usr/bin/env python3
"""
Script para monitorear el deployment en tiempo real
"""

import paramiko
from paramiko import SSHClient, AutoAddPolicy
import time

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"

print("👁️  Monitoreando deployment...")
print(f"📡 Conectando a {SSH_HOST}...\n")

ssh = SSHClient()
ssh.set_missing_host_key_policy(AutoAddPolicy())

try:
    ssh.connect(hostname=SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=10)
    
    print("📋 Últimas 50 líneas del log (actualizando cada 10 segundos):\n")
    
    for i in range(60):  # 10 minutos máximo
        stdin, stdout, stderr = ssh.exec_command("tail -50 /tmp/deploy.log 2>/dev/null")
        
        lines = stdout.readlines()
        
        # Limpiar pantalla (simplificado)
        print("\n" + "="*80)
        print(f"📊 Actualización #{i+1} - {time.strftime('%H:%M:%S')}")
        print("="*80 + "\n")
        
        for line in lines[-50:]:  # Últimas 50 líneas
            print(line.rstrip())
        
        # Buscar indicadores de finalización
        log_text = ''.join(lines)
        
        if '✅ Imagen construida exitosamente' in log_text:
            print("\n\n🎉 ¡BUILD EXITOSO!")
            break
        
        if 'ERROR:' in log_text or 'Error' in log_text:
            print("\n\n⚠️  Posibles errores detectados")
        
        if '✅ ¡Deployment completado!' in log_text:
            print("\n\n🎉 ¡DEPLOYMENT COMPLETADO!")
            break
        
        time.sleep(10)
    
except KeyboardInterrupt:
    print("\n\n⏸️  Monitoreo detenido por usuario")
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
finally:
    ssh.close()
    print("\n🔌 Conexión cerrada")
