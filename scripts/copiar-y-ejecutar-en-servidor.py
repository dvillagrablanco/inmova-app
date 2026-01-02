#!/usr/bin/env python3
"""
Copia el script de configuración al servidor y lo ejecuta
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "xcc9brgkMMbf"
APP_DIR = "/opt/inmova-app"

def main():
    print("=" * 70)
    print("  📤 COPIANDO SCRIPT AL SERVIDOR")
    print("=" * 70)
    
    # Leer el script
    with open('scripts/configurar-triada-servidor-directo.sh', 'r') as f:
        script_content = f.read()
    
    print(f"\n📄 Script leído ({len(script_content)} bytes)")
    
    # Conectar
    print(f"\n📡 Conectando a {SERVER_IP}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        print("   ✅ Conexión SSH establecida")
        
        # Copiar script al servidor
        script_path = f"{APP_DIR}/configurar-triada.sh"
        
        print(f"\n📤 Copiando script a {script_path}...")
        sftp = client.open_sftp()
        with sftp.open(script_path, 'w') as remote_file:
            remote_file.write(script_content)
        sftp.close()
        print("   ✅ Script copiado")
        
        # Dar permisos de ejecución
        print("\n🔧 Dando permisos de ejecución...")
        stdin, stdout, stderr = client.exec_command(f"chmod +x {script_path}")
        stdout.channel.recv_exit_status()
        print("   ✅ Permisos asignados")
        
        print("\n" + "=" * 70)
        print("  ✅ SCRIPT COPIADO AL SERVIDOR")
        print("=" * 70)
        
        print(f"\n📍 Ubicación: {script_path}")
        print(f"\n🚀 SIGUIENTE PASO:")
        print(f"\n1. Conéctate al servidor:")
        print(f"   ssh {SERVER_USER}@{SERVER_IP}")
        print(f"   Password: {SERVER_PASSWORD}")
        print(f"\n2. Ejecuta el script:")
        print(f"   {script_path}")
        print(f"\n3. Sigue las instrucciones en pantalla (15 min)")
        
        print(f"\nEl script te pedirá las 3 credenciales:")
        print(f"  - Sentry DSN")
        print(f"  - Crisp Website ID")  
        print(f"  - BetterStack Status Page URL")
        
        print(f"\nY las configurará automáticamente.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
        
    finally:
        client.close()
        print("\n🔌 Conexión SSH cerrada")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
