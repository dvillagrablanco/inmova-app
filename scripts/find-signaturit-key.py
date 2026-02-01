#!/usr/bin/env python3
"""
Buscar el valor completo de SIGNATURIT_API_KEY
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando SSH"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print("=" * 70)
    print("🔍 BUSCANDO SIGNATURIT_API_KEY COMPLETA")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    found_key = None
    
    try:
        # Buscar en archivos específicos que mencionaron KmWLXStHXziKPM
        files_to_check = [
            f"{APP_PATH}/AUDITORIA_ACTUALIZADA_INTEGRACIONES_03_ENE_2026.md",
            f"{APP_PATH}/FIRMA_DIGITAL_DUAL_PROVIDER.md",
            f"{APP_PATH}/RESUMEN_FINAL_TODO_COMPLETADO.md",
            f"{APP_PATH}/REPORTE_EJECUTIVO_FINAL.md",
        ]
        
        print("🔍 Buscando en archivos de documentación...")
        
        for f in files_to_check:
            print(f"\n📄 {f}:")
            status, content = exec_cmd(client, f"cat '{f}' 2>/dev/null | grep -i 'SIGNATURIT_API_KEY'")
            if content.strip():
                print(content)
                # Buscar el valor completo
                match = re.search(r'SIGNATURIT_API_KEY[=:]["\'`]*([A-Za-z0-9_-]{20,})', content)
                if match:
                    key = match.group(1)
                    if not '...' in key and len(key) > 20:
                        found_key = key
                        print(f"  ✅ Key encontrada: {key}")
        
        # Buscar patrón KmWLXStHXziKPM en todo el sistema
        print("\n" + "=" * 70)
        print("🔍 Buscando patrón 'KmWLXStHXziKPM' en todo el sistema...")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"grep -r 'KmWLXStHXziKPM' {APP_PATH} /root /home 2>/dev/null | head -30")
        if output.strip():
            print(output)
            # Extraer key completa
            match = re.search(r'KmWLXStHXziKPM[A-Za-z0-9_-]*', output)
            if match:
                key = match.group()
                if len(key) > 20:
                    found_key = key
                    print(f"\n✅ Key completa encontrada: {key}")
        
        # Buscar en archivos .env.* del servidor
        print("\n" + "=" * 70)
        print("🔍 Buscando en todos los archivos .env...")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"grep -r 'SIGNATURIT' {APP_PATH}/.env* /root/.env* 2>/dev/null")
        if output.strip():
            print(output)
            match = re.search(r'SIGNATURIT_API_KEY[=]["\']*([A-Za-z0-9_-]{20,})', output)
            if match:
                key = match.group(1)
                if not '...' in key:
                    found_key = key
        
        # Buscar en PM2 dump
        print("\n" + "=" * 70)
        print("🔍 Buscando en PM2 dump...")
        print("=" * 70)
        
        status, output = exec_cmd(client, "cat /root/.pm2/dump.pm2 2>/dev/null | grep -o 'SIGNATURIT_API_KEY[^,}]*'")
        if output.strip():
            print(output)
            match = re.search(r'SIGNATURIT_API_KEY[":"]+([A-Za-z0-9_-]{20,})', output)
            if match:
                found_key = match.group(1)
        
        # Buscar en archivos de backup de .env
        print("\n" + "=" * 70)
        print("🔍 Buscando en backups de .env...")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"find {APP_PATH} -name '*.env*backup*' -o -name '*.backup*.env*' 2>/dev/null | head -20")
        backup_files = [f for f in output.strip().split('\n') if f]
        
        for f in backup_files:
            status, content = exec_cmd(client, f"grep 'SIGNATURIT' '{f}' 2>/dev/null")
            if content.strip() and 'KmWLXStHXziKPM' in content:
                print(f"\n📄 {f}:")
                print(content)
                match = re.search(r'KmWLXStHXziKPM[A-Za-z0-9_-]*', content)
                if match and len(match.group()) > 20:
                    found_key = match.group()
        
        # Buscar en /root/.env.inmova.backup
        print("\n" + "=" * 70)
        print("🔍 Buscando en /root/.env.inmova.backup...")
        print("=" * 70)
        
        status, output = exec_cmd(client, "cat /root/.env.inmova.backup 2>/dev/null | grep SIGNATURIT")
        if output.strip():
            print(output)
            match = re.search(r'SIGNATURIT_API_KEY[=]["\']*([A-Za-z0-9_-]{20,})', output)
            if match:
                found_key = match.group(1)
        
        # Buscar en archivos de notas
        print("\n" + "=" * 70)
        print("🔍 Buscando en archivos de notas en /root...")
        print("=" * 70)
        
        status, output = exec_cmd(client, "cat /root/INMOVA_DEPLOYMENT_COMPLETO.md 2>/dev/null | grep -i signaturit")
        if output.strip():
            print(output[:500])
        
        # Resumen
        print("\n" + "=" * 70)
        print("📊 RESULTADO")
        print("=" * 70)
        
        if found_key and len(found_key) > 20 and '...' not in found_key:
            print(f"\n✅ SIGNATURIT_API_KEY encontrada: {found_key}")
            
            # Configurar en .env.production
            print("\n🔧 Configurando en .env.production...")
            
            # Verificar si ya existe
            status, output = exec_cmd(client, f"grep 'SIGNATURIT_API_KEY' {APP_PATH}/.env.production")
            
            if 'SIGNATURIT_API_KEY' in output:
                # Actualizar
                exec_cmd(client, f"sed -i 's|SIGNATURIT_API_KEY=.*|SIGNATURIT_API_KEY={found_key}|' {APP_PATH}/.env.production")
                print("  ✏️ Actualizado")
            else:
                # Agregar
                exec_cmd(client, f"echo 'SIGNATURIT_API_KEY={found_key}' >> {APP_PATH}/.env.production")
                print("  ➕ Agregado")
            
            # Reiniciar PM2
            print("\n🔄 Reiniciando PM2...")
            exec_cmd(client, "pm2 restart inmova-app --update-env")
            
            print("\n✅ Signaturit configurado correctamente")
        else:
            print("\n⚠️ No se encontró la API key completa de Signaturit")
            print("\nLa documentación menciona 'KmWLXStHXziKPM...' pero el valor completo no está disponible")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
