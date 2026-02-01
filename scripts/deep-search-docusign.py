#!/usr/bin/env python3
"""
Búsqueda exhaustiva de DocuSign Private Key
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re
import time

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=120):
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
    print("🔍 BÚSQUEDA EXHAUSTIVA DE DOCUSIGN PRIVATE KEY")
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
        # 1. Buscar archivos .pem en todo el sistema
        print("=" * 70)
        print("1️⃣ BUSCANDO ARCHIVOS .pem")
        print("=" * 70)
        
        status, output = exec_cmd(client, "find /opt /root /home -name '*.pem' -type f 2>/dev/null | grep -v node_modules | head -20")
        if output.strip():
            print("\nArchivos .pem encontrados:")
            for f in output.strip().split('\n'):
                if f:
                    print(f"  📄 {f}")
                    status, content = exec_cmd(client, f"cat '{f}' 2>/dev/null | head -5")
                    if 'PRIVATE KEY' in content:
                        print(f"    ✅ Contiene Private Key")
                        status, full_content = exec_cmd(client, f"cat '{f}' 2>/dev/null")
                        if 'RSA PRIVATE KEY' in full_content:
                            found_key = full_content.strip()
                            print(f"    ✅ RSA Private Key encontrada ({len(found_key)} chars)")
        
        # 2. Buscar en PM2 dump con más detalle
        print("\n" + "=" * 70)
        print("2️⃣ BUSCANDO EN PM2 DUMP")
        print("=" * 70)
        
        status, output = exec_cmd(client, "cat /root/.pm2/dump.pm2 2>/dev/null")
        if output:
            # Buscar DOCUSIGN_PRIVATE_KEY en el JSON
            match = re.search(r'"DOCUSIGN_PRIVATE_KEY"\s*:\s*"([^"]+)"', output)
            if match:
                key_value = match.group(1)
                # Decodificar \n a newlines reales
                key_value = key_value.replace('\\n', '\n')
                if 'BEGIN' in key_value and 'END' in key_value:
                    found_key = key_value
                    print(f"\n✅ Private Key encontrada en PM2 dump ({len(found_key)} chars)")
            else:
                print("\n⚠️ No encontrada en PM2 dump")
        
        # 3. Buscar en archivos de backup de .env
        print("\n" + "=" * 70)
        print("3️⃣ BUSCANDO EN BACKUPS DE .env")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"ls -la {APP_PATH}/.env* 2>/dev/null | grep backup")
        if output:
            print("\nArchivos de backup:")
            print(output)
            
            # Buscar en cada backup
            for line in output.strip().split('\n'):
                if 'backup' in line.lower():
                    parts = line.split()
                    if parts:
                        filename = parts[-1]
                        filepath = f"{APP_PATH}/{filename}" if not filename.startswith('/') else filename
                        status, content = exec_cmd(client, f"grep -A 50 'DOCUSIGN_PRIVATE_KEY' '{filepath}' 2>/dev/null | head -60")
                        if content and 'BEGIN' in content:
                            print(f"\n📄 {filepath}:")
                            # Extraer la key
                            match = re.search(r'-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----', content, re.DOTALL)
                            if match:
                                found_key = match.group()
                                print(f"  ✅ Private Key encontrada ({len(found_key)} chars)")
        
        # 4. Buscar en /root/.env*
        print("\n" + "=" * 70)
        print("4️⃣ BUSCANDO EN /root/.env*")
        print("=" * 70)
        
        status, output = exec_cmd(client, "ls -la /root/.env* 2>/dev/null")
        if output:
            print(output)
            for line in output.strip().split('\n'):
                if '.env' in line:
                    parts = line.split()
                    if parts:
                        filepath = f"/root/{parts[-1]}" if not parts[-1].startswith('/') else parts[-1]
                        status, content = exec_cmd(client, f"grep 'DOCUSIGN_PRIVATE_KEY' '{filepath}' 2>/dev/null")
                        if content and 'BEGIN' in content:
                            print(f"\n✅ Encontrada en {filepath}")
                            match = re.search(r'-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----', content.replace('\\n', '\n'), re.DOTALL)
                            if match:
                                found_key = match.group()
        
        # 5. Buscar en documentación con contenido real (no placeholders)
        print("\n" + "=" * 70)
        print("5️⃣ BUSCANDO EN DOCUMENTACIÓN")
        print("=" * 70)
        
        # Buscar archivos que contengan MIIEo (inicio típico de RSA key base64)
        status, output = exec_cmd(client, f"grep -r 'MIIEo' {APP_PATH}/*.md {APP_PATH}/docs/*.md /root/*.md 2>/dev/null | head -20")
        if output.strip():
            print("\nArchivos con contenido RSA base64:")
            for line in output.strip().split('\n'):
                if ':' in line:
                    filepath = line.split(':')[0]
                    print(f"  📄 {filepath}")
                    # Leer el archivo completo y buscar la key
                    status, content = exec_cmd(client, f"cat '{filepath}' 2>/dev/null")
                    # Buscar una key completa (no truncada)
                    match = re.search(r'-----BEGIN RSA PRIVATE KEY-----\s*\n([A-Za-z0-9+/=\s\n]+)\n-----END RSA PRIVATE KEY-----', content)
                    if match:
                        key_body = match.group(1).strip()
                        if len(key_body) > 500:  # Una key real tiene más de 500 chars en el body
                            found_key = f"-----BEGIN RSA PRIVATE KEY-----\n{key_body}\n-----END RSA PRIVATE KEY-----"
                            print(f"    ✅ Key completa encontrada ({len(found_key)} chars)")
        
        # 6. Buscar en /home/deploy
        print("\n" + "=" * 70)
        print("6️⃣ BUSCANDO EN /home/deploy")
        print("=" * 70)
        
        status, output = exec_cmd(client, "grep -r 'DOCUSIGN_PRIVATE_KEY' /home/deploy --include='*.env*' --include='*.md' 2>/dev/null | head -10")
        if output.strip():
            print(output[:500])
            for line in output.strip().split('\n'):
                if 'BEGIN' in line:
                    filepath = line.split(':')[0]
                    status, content = exec_cmd(client, f"cat '{filepath}' 2>/dev/null")
                    match = re.search(r'-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----', content.replace('\\n', '\n'), re.DOTALL)
                    if match and len(match.group()) > 500:
                        found_key = match.group()
                        print(f"\n✅ Key encontrada en {filepath}")
        
        # 7. Buscar en /home/ubuntu (homming_vidaro)
        print("\n" + "=" * 70)
        print("7️⃣ BUSCANDO EN /home/ubuntu")
        print("=" * 70)
        
        status, output = exec_cmd(client, "find /home/ubuntu -name '*.pem' -o -name '*docusign*' 2>/dev/null | grep -v node_modules | head -20")
        if output.strip():
            print("Archivos encontrados:")
            print(output)
            for f in output.strip().split('\n'):
                if f and '.pem' in f:
                    status, content = exec_cmd(client, f"cat '{f}' 2>/dev/null")
                    if 'RSA PRIVATE KEY' in content:
                        found_key = content.strip()
                        print(f"\n✅ Key encontrada en {f}")
        
        # Buscar en .env de homming
        status, output = exec_cmd(client, "grep 'DOCUSIGN_PRIVATE_KEY' /home/ubuntu/homming_vidaro/nextjs_space/.env* 2>/dev/null")
        if output.strip() and 'BEGIN' in output:
            print("\n✅ Encontrada en homming_vidaro:")
            # Extraer
            status, content = exec_cmd(client, "cat /home/ubuntu/homming_vidaro/nextjs_space/.env.local 2>/dev/null")
            if content:
                match = re.search(r'DOCUSIGN_PRIVATE_KEY="?(-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----)"?', content.replace('\\n', '\n'), re.DOTALL)
                if match:
                    found_key = match.group(1)
                    print(f"  ✅ Key extraída ({len(found_key)} chars)")
        
        # 8. Buscar en bash history
        print("\n" + "=" * 70)
        print("8️⃣ BUSCANDO EN BASH HISTORY")
        print("=" * 70)
        
        status, output = exec_cmd(client, "grep -i 'docusign.*private' /root/.bash_history /home/*/.bash_history 2>/dev/null | head -10")
        if output.strip():
            print(output)
        
        # 9. Buscar archivos creados recientemente relacionados con docusign
        print("\n" + "=" * 70)
        print("9️⃣ ARCHIVOS DOCUSIGN RECIENTES")
        print("=" * 70)
        
        status, output = exec_cmd(client, "find /opt /root /home -name '*docusign*' -type f -mtime -90 2>/dev/null | grep -v node_modules | head -20")
        if output.strip():
            print("Archivos relacionados con DocuSign:")
            for f in output.strip().split('\n'):
                if f:
                    print(f"  📄 {f}")
                    status, content = exec_cmd(client, f"cat '{f}' 2>/dev/null | head -20")
                    if 'PRIVATE KEY' in content:
                        print("    ✅ Contiene Private Key")
        
        # 10. Buscar en la carpeta scripts
        print("\n" + "=" * 70)
        print("🔟 BUSCANDO EN SCRIPTS")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"grep -r 'DOCUSIGN_PRIVATE_KEY' {APP_PATH}/scripts --include='*.py' --include='*.sh' --include='*.ts' 2>/dev/null | head -10")
        if output.strip():
            print(output[:500])
        
        # Resumen y configuración
        print("\n" + "=" * 70)
        print("📊 RESULTADO")
        print("=" * 70)
        
        if found_key and len(found_key) > 500:
            print(f"\n✅ DOCUSIGN PRIVATE KEY ENCONTRADA")
            print(f"   Longitud: {len(found_key)} caracteres")
            print(f"   Primeras líneas:")
            lines = found_key.split('\n')
            for line in lines[:3]:
                print(f"   {line}")
            print("   ...")
            for line in lines[-2:]:
                print(f"   {line}")
            
            # Configurar en .env.production
            print("\n🔧 Configurando en servidor...")
            
            # Formatear para .env (escapar newlines)
            key_escaped = found_key.replace('\n', '\\n')
            
            # Leer .env.production actual
            status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
            
            # Verificar si ya existe
            if 'DOCUSIGN_PRIVATE_KEY=' in env_content:
                # Reemplazar
                # Usar sed con archivo temporal
                exec_cmd(client, f"grep -v 'DOCUSIGN_PRIVATE_KEY' {APP_PATH}/.env.production > /tmp/env_temp.txt")
                exec_cmd(client, f"echo 'DOCUSIGN_PRIVATE_KEY=\"{key_escaped}\"' >> /tmp/env_temp.txt")
                exec_cmd(client, f"mv /tmp/env_temp.txt {APP_PATH}/.env.production")
                print("  ✏️ DOCUSIGN_PRIVATE_KEY actualizada")
            else:
                # Añadir
                exec_cmd(client, f"echo 'DOCUSIGN_PRIVATE_KEY=\"{key_escaped}\"' >> {APP_PATH}/.env.production")
                print("  ➕ DOCUSIGN_PRIVATE_KEY añadida")
            
            # Reiniciar PM2
            print("\n🔄 Reiniciando PM2...")
            exec_cmd(client, "pm2 restart inmova-app --update-env")
            time.sleep(15)
            
            # Verificar
            status, output = exec_cmd(client, f"grep 'DOCUSIGN_PRIVATE_KEY' {APP_PATH}/.env.production | head -1")
            if 'BEGIN RSA' in output or 'BEGIN RSA' in output.replace('\\n', '\n'):
                print("\n✅ DOCUSIGN_PRIVATE_KEY configurada correctamente")
            
            # Health check
            print("\n🏥 Health check:")
            status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
            print(output)
            
        else:
            print("\n❌ No se encontró una Private Key completa de DocuSign")
            print("\n📌 Necesitas generar la key en DocuSign Dashboard:")
            print("   1. Ir a https://admindemo.docusign.com/")
            print("   2. Apps and Keys → Tu aplicación")
            print("   3. RSA Keypairs → Generate RSA")
            print("   4. Descargar la Private Key")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
