#!/usr/bin/env python3
"""Verificar todas las rutas relevantes"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

ROUTES_TO_CHECK = [
    # Configuración principal
    '/configuracion',
    '/configuracion/integraciones',
    '/configuracion/integraciones/stripe',
    '/configuracion/integraciones/gocardless',
    '/configuracion/integraciones/redsys',
    
    # Herramientas empresa (nuevas)
    '/admin/herramientas-empresa',
    
    # Contabilidad
    '/contabilidad/integraciones',
    
    # Banca
    '/admin/integraciones-banca',
    
    # Firma digital
    '/firma-digital/configuracion',
    
    # Pagos
    '/pagos/configuracion',
    
    # Seguridad
    '/seguridad',
    
    # Empresa
    '/empresa/configuracion',
    
    # Dashboard integrations (dinámicas)
    '/dashboard/integrations/idealista',
    '/dashboard/integrations/fotocasa',
    '/dashboard/integrations/crisp',
    '/dashboard/integrations/twilio',
    '/dashboard/integrations/hotjar',
]

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    
    print("\n" + "="*60)
    print("🔍 VERIFICACIÓN DE RUTAS - PRODUCCIÓN")
    print("="*60 + "\n")
    
    passed = 0
    failed = 0
    
    for route in ROUTES_TO_CHECK:
        stdin, stdout, stderr = client.exec_command(
            f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}"
        )
        stdout.channel.recv_exit_status()
        http_code = stdout.read().decode().strip()
        
        if http_code == "200":
            print(f"✅ {route}")
            passed += 1
        else:
            print(f"❌ {route} -> {http_code}")
            failed += 1
    
    client.close()
    
    print("\n" + "="*60)
    print(f"📊 RESULTADO: {passed}/{len(ROUTES_TO_CHECK)} rutas funcionando")
    if failed > 0:
        print(f"   ❌ {failed} rutas con errores")
    else:
        print("   ✅ Todas las rutas funcionan correctamente")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
