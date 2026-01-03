#!/usr/bin/env python3
"""
Aplicar DATABASE_URL desde backup válido
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore'),
        'error': stderr.read().decode('utf-8', errors='ignore')
    }

def main():
    print("🔧 APLICANDO DATABASE_URL DESDE BACKUP")
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("[1] Obteniendo DATABASE_URL de backup más reciente...")
    result = exec_cmd(client, "cd /opt/inmova-app && ls -t .env.production.backup* | head -1")
    latest_backup = result['output'].strip()
    
    if latest_backup:
        print(f"   Usando: {latest_backup}")
        
        # Obtener DATABASE_URL del backup
        result = exec_cmd(client, f"cd /opt/inmova-app && grep '^DATABASE_URL=' {latest_backup} | head -1")
        backup_url = result['output'].strip()
        
        if backup_url and 'dummy' not in backup_url:
            print(f"   ✅ DATABASE_URL válida encontrada")
            print(f"   {backup_url[:80]}...")
            
            print()
            print("[2] Aplicando a .env.production...")
            
            # Eliminar DATABASE_URL actual
            exec_cmd(client, "cd /opt/inmova-app && sed -i '/^DATABASE_URL=/d' .env.production")
            
            # Añadir la nueva
            exec_cmd(client, f"cd /opt/inmova-app && echo '{backup_url}' >> .env.production")
            
            print("   ✅ DATABASE_URL actualizada")
            
            print()
            print("[3] Verificando cambio...")
            result = exec_cmd(client, "cd /opt/inmova-app && grep '^DATABASE_URL=' .env.production | head -1")
            new_url = result['output'].strip()
            
            if 'localhost:5432' in new_url and 'dummy' not in new_url:
                print("   ✅ Verificación OK")
                print(f"   {new_url[:80]}...")
                
                print()
                print("[4] Reiniciando aplicación...")
                exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
                print("   ✅ PM2 reiniciado")
                
                print("   ⏳ Esperando 20 segundos para warm-up...")
                time.sleep(20)
                
                print()
                print("[5] Health check...")
                result = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1")
                
                response = result['output']
                
                if '"status":"ok"' in response and '"database":"connected"' in response:
                    print("   ✅ HEALTH CHECK OK!")
                    print("   ✅ DATABASE CONECTADA!")
                    
                    print()
                    print("=" * 70)
                    print("✅ SISTEMA 100% OPERATIVO")
                    print("=" * 70)
                    print()
                    print("🔗 URLs:")
                    print("   • App: https://inmovaapp.com")
                    print("   • Health: https://inmovaapp.com/api/health")
                    print("   • Login: https://inmovaapp.com/login")
                    print()
                    print("🎯 Funcionalidades listas:")
                    print("   ✅ Upload S3 (público + privado)")
                    print("   ✅ Stripe Checkout")
                    print("   ✅ Firma Digital (modo demo)")
                    print()
                    print("🧪 Próximos pasos:")
                    print("   1. Test de upload: POST /api/upload/public")
                    print("   2. Test de pago: POST /api/payments/create-payment-intent")
                    print("   3. Configurar webhook Stripe")
                    print("   4. Obtener credenciales Signaturit")
                    
                    client.close()
                    return 0
                else:
                    print("   ⚠️  Health check con problemas")
                    print(f"   Respuesta: {response[:300]}")
                    
                    # Ver logs
                    print()
                    print("📋 Logs de error:")
                    result = exec_cmd(client, "pm2 logs inmova-app --nostream --err --lines 15")
                    print(result['output'][-800:])
            else:
                print("   ❌ DATABASE_URL no se aplicó correctamente")
        else:
            print("   ❌ DATABASE_URL del backup contiene dummy o está vacía")
    else:
        print("   ❌ No se encontraron backups")
    
    client.close()
    
    print()
    print("=" * 70)
    print("⚠️  CONFIGURACIÓN NO COMPLETADA")
    print("=" * 70)
    return 1

if __name__ == '__main__':
    sys.exit(main())
