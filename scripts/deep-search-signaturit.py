#!/usr/bin/env python3
"""
Búsqueda exhaustiva de credenciales de Signaturit
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
    print("🔍 BÚSQUEDA EXHAUSTIVA DE SIGNATURIT")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    found_keys = []
    
    try:
        # 1. Buscar en TODOS los archivos .env del sistema
        print("=" * 70)
        print("1️⃣ TODOS LOS ARCHIVOS .env DEL SISTEMA")
        print("=" * 70)
        
        status, output = exec_cmd(client, "find / -name '*.env*' -type f 2>/dev/null | head -100")
        env_files = [f for f in output.strip().split('\n') if f and not 'node_modules' in f]
        
        print(f"\nEncontrados {len(env_files)} archivos .env")
        
        for f in env_files:
            status, content = exec_cmd(client, f"grep -i signaturit '{f}' 2>/dev/null")
            if content.strip():
                print(f"\n📄 {f}:")
                print(content)
                # Extraer API key
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s]{20,})', content)
                if match:
                    found_keys.append({"key": match.group(1), "source": f})
        
        # 2. Buscar en archivos de backup
        print("\n" + "=" * 70)
        print("2️⃣ ARCHIVOS DE BACKUP")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"find {APP_PATH} /root /home -name '*.backup*' -o -name '*.bak' -o -name '*backup*' 2>/dev/null | head -50")
        backup_files = [f for f in output.strip().split('\n') if f]
        
        print(f"\nEncontrados {len(backup_files)} archivos de backup")
        
        for f in backup_files:
            status, content = exec_cmd(client, f"grep -i signaturit '{f}' 2>/dev/null")
            if content.strip():
                print(f"\n📄 {f}:")
                print(content[:500])
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s]{20,})', content)
                if match:
                    found_keys.append({"key": match.group(1), "source": f})
        
        # 3. Buscar en PM2 (todos los dumps)
        print("\n" + "=" * 70)
        print("3️⃣ PM2 DUMPS Y LOGS")
        print("=" * 70)
        
        status, output = exec_cmd(client, "find /root/.pm2 -type f 2>/dev/null")
        pm2_files = output.strip().split('\n')
        
        for f in pm2_files:
            if f:
                status, content = exec_cmd(client, f"grep -i signaturit '{f}' 2>/dev/null")
                if content.strip():
                    print(f"\n📄 {f}:")
                    print(content[:300])
                    match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s,}{]{20,})', content)
                    if match:
                        found_keys.append({"key": match.group(1), "source": f})
        
        # 4. Buscar en historial de bash
        print("\n" + "=" * 70)
        print("4️⃣ HISTORIAL DE BASH")
        print("=" * 70)
        
        for hist_file in ["/root/.bash_history", "/home/deploy/.bash_history", "/home/ubuntu/.bash_history"]:
            status, content = exec_cmd(client, f"grep -i signaturit '{hist_file}' 2>/dev/null")
            if content.strip():
                print(f"\n📄 {hist_file}:")
                print(content)
                match = re.search(r'SIGNATURIT[_A-Z]*[=]["\']*([^"\'=\s]{20,})', content)
                if match:
                    found_keys.append({"key": match.group(1), "source": hist_file})
        
        # 5. Buscar en documentación .md
        print("\n" + "=" * 70)
        print("5️⃣ DOCUMENTACIÓN (.md)")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"grep -r -l 'signaturit' {APP_PATH}/*.md {APP_PATH}/docs/*.md /home/deploy/*.md 2>/dev/null | head -20")
        md_files = [f for f in output.strip().split('\n') if f]
        
        for f in md_files:
            status, content = exec_cmd(client, f"grep -i -A2 -B2 'SIGNATURIT' '{f}' 2>/dev/null")
            if content.strip():
                print(f"\n📄 {f}:")
                print(content[:500])
                # Buscar patrones de API key
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\'`]*([a-zA-Z0-9_-]{20,})', content)
                if match:
                    found_keys.append({"key": match.group(1), "source": f})
        
        # 6. Buscar en /home/deploy (versión antigua de la app)
        print("\n" + "=" * 70)
        print("6️⃣ /home/deploy (versión antigua)")
        print("=" * 70)
        
        status, output = exec_cmd(client, "grep -r 'SIGNATURIT' /home/deploy --include='*.env*' --include='*.json' --include='*.md' 2>/dev/null | head -30")
        if output.strip():
            print(output)
            for line in output.split('\n'):
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s]{20,})', line)
                if match:
                    found_keys.append({"key": match.group(1), "source": "deploy"})
        
        # 7. Buscar en /root directamente
        print("\n" + "=" * 70)
        print("7️⃣ DIRECTORIO /root")
        print("=" * 70)
        
        status, output = exec_cmd(client, "grep -r 'SIGNATURIT' /root --include='*.env*' --include='*.txt' --include='*.md' --include='*.json' 2>/dev/null | head -30")
        if output.strip():
            print(output)
            for line in output.split('\n'):
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s]{20,})', line)
                if match:
                    found_keys.append({"key": match.group(1), "source": "/root"})
        
        # 8. Buscar en versiones antiguas de la app
        print("\n" + "=" * 70)
        print("8️⃣ VERSIONES ANTIGUAS DE LA APP")
        print("=" * 70)
        
        status, output = exec_cmd(client, "ls -la /opt/ | grep inmova")
        print(output)
        
        status, output = exec_cmd(client, "grep -r 'SIGNATURIT' /opt/inmova-app.old* --include='*.env*' 2>/dev/null | head -20")
        if output.strip():
            print(output)
            for line in output.split('\n'):
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s]{20,})', line)
                if match:
                    found_keys.append({"key": match.group(1), "source": "old app"})
        
        # 9. Buscar en archivos de configuración de Nginx
        print("\n" + "=" * 70)
        print("9️⃣ NGINX Y LOGS")
        print("=" * 70)
        
        status, output = exec_cmd(client, "grep -r 'signaturit' /etc/nginx /var/log/nginx 2>/dev/null | head -20")
        if output.strip():
            print(output)
        
        # 10. Buscar en archivos JSON de configuración
        print("\n" + "=" * 70)
        print("🔟 ARCHIVOS JSON DE CONFIGURACIÓN")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"find {APP_PATH} -name '*.json' -exec grep -l -i signaturit {{}} \\; 2>/dev/null | head -20")
        json_files = [f for f in output.strip().split('\n') if f]
        
        for f in json_files:
            status, content = exec_cmd(client, f"grep -i signaturit '{f}' 2>/dev/null")
            if content.strip():
                print(f"\n📄 {f}:")
                print(content[:300])
        
        # 11. Buscar en archivos TypeScript/JavaScript del código
        print("\n" + "=" * 70)
        print("1️⃣1️⃣ CÓDIGO FUENTE (TS/JS)")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"grep -r 'SIGNATURIT_API_KEY\\|signaturit.*key\\|signaturit.*token' {APP_PATH}/lib {APP_PATH}/app --include='*.ts' --include='*.js' 2>/dev/null | head -30")
        if output.strip():
            print(output)
        
        # 12. Buscar API keys con formato específico de Signaturit
        print("\n" + "=" * 70)
        print("1️⃣2️⃣ BÚSQUEDA POR PATRÓN DE API KEY")
        print("=" * 70)
        
        # Signaturit API keys suelen empezar con ciertos patrones
        patterns = [
            "sig_",
            "sign_",
            "signaturit_",
            "sk_sig",
        ]
        
        for pattern in patterns:
            status, output = exec_cmd(client, f"grep -r '{pattern}' /opt /root /home --include='*.env*' --include='*.json' --include='*.md' 2>/dev/null | head -10")
            if output.strip():
                print(f"\nPatrón '{pattern}':")
                print(output)
        
        # 13. Buscar en base de datos (tabla de configuración si existe)
        print("\n" + "=" * 70)
        print("1️⃣3️⃣ BASE DE DATOS")
        print("=" * 70)
        
        status, output = exec_cmd(client, "psql -U inmova_user -d inmova_production -c \"SELECT * FROM settings WHERE key LIKE '%signaturit%';\" 2>/dev/null")
        if output.strip() and 'ERROR' not in output:
            print(output)
        
        status, output = exec_cmd(client, "psql -U inmova_user -d inmova_production -c \"SELECT * FROM integrations WHERE name LIKE '%signaturit%';\" 2>/dev/null")
        if output.strip() and 'ERROR' not in output:
            print(output)
        
        # 14. Buscar en variables de entorno del sistema
        print("\n" + "=" * 70)
        print("1️⃣4️⃣ VARIABLES DE ENTORNO DEL SISTEMA")
        print("=" * 70)
        
        status, output = exec_cmd(client, "env | grep -i signaturit")
        if output.strip():
            print(output)
        
        status, output = exec_cmd(client, "cat /etc/environment | grep -i signaturit")
        if output.strip():
            print(output)
        
        # 15. Buscar archivos modificados recientemente que contengan signaturit
        print("\n" + "=" * 70)
        print("1️⃣5️⃣ ARCHIVOS RECIENTES CON SIGNATURIT")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"find {APP_PATH} /root /home -type f -mtime -30 -exec grep -l -i signaturit {{}} \\; 2>/dev/null | head -20")
        recent_files = [f for f in output.strip().split('\n') if f]
        
        for f in recent_files:
            status, content = exec_cmd(client, f"grep -i signaturit '{f}' 2>/dev/null")
            if content.strip():
                print(f"\n📄 {f} (modificado recientemente):")
                print(content[:300])
                match = re.search(r'SIGNATURIT[_A-Z]*[=:]["\']*([^"\'=\s]{20,})', content)
                if match:
                    found_keys.append({"key": match.group(1), "source": f})
        
        # Resumen
        print("\n" + "=" * 70)
        print("📊 RESUMEN DE BÚSQUEDA")
        print("=" * 70)
        
        # Filtrar keys únicas y válidas
        valid_keys = []
        for item in found_keys:
            key = item["key"]
            # Filtrar placeholders
            if not any(ph in key.lower() for ph in ['placeholder', 'your_', 'tu_', 'xxx', 'example', '<']):
                if len(key) >= 20:
                    valid_keys.append(item)
        
        if valid_keys:
            print(f"\n✅ Se encontraron {len(valid_keys)} posibles API keys:")
            for item in valid_keys:
                print(f"  • {item['key'][:30]}... (de {item['source']})")
        else:
            print("\n❌ No se encontró ninguna API key válida de Signaturit")
            print("\n📌 La API key de Signaturit debe configurarse desde:")
            print("   1. Ir a https://app.signaturit.com/")
            print("   2. Settings > API")
            print("   3. Copiar la API Key")
        
        return valid_keys
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
