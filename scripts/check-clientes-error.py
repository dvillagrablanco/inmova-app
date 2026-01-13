#!/usr/bin/env python3
"""
Script para verificar el error de /admin/clientes en producción
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        
        print("🔍 Verificando logs de errores relacionados con /api/admin/companies...")
        print("=" * 70)
        
        # Ver logs de PM2
        stdin, stdout, stderr = client.exec_command(
            "pm2 logs inmova-app --err --nostream --lines 50 | grep -i 'companies\\|clientes\\|error' | head -30",
            timeout=30
        )
        output = stdout.read().decode('utf-8', errors='ignore')
        print("📋 Logs de PM2 (errores):")
        print(output if output else "No hay errores relacionados")
        
        print("\n" + "=" * 70)
        
        # Verificar conexión a BD
        stdin, stdout, stderr = client.exec_command(
            "cd /opt/inmova-app && npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM \"Company\"' 2>&1 | head -10",
            timeout=30
        )
        output = stdout.read().decode('utf-8', errors='ignore')
        print("📊 Verificación de empresas en BD:")
        print(output)
        
        print("\n" + "=" * 70)
        
        # Probar API directamente
        stdin, stdout, stderr = client.exec_command(
            "curl -s http://localhost:3000/api/admin/companies -H 'Cookie: $(cat /tmp/admin-cookie.txt 2>/dev/null || echo \"\")' | head -c 500",
            timeout=30
        )
        output = stdout.read().decode('utf-8', errors='ignore')
        print("🌐 Respuesta de API /api/admin/companies:")
        print(output[:500] if output else "Sin respuesta")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    main()
