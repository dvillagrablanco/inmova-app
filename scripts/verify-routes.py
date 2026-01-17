#!/usr/bin/env python3
"""Verificar rutas desplegadas"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

ROUTES_TO_CHECK = [
    '/configuracion',
    '/configuracion/integraciones',
    '/configuracion/integraciones/gocardless',
    '/configuracion/integraciones/redsys',
    '/configuracion/integraciones/stripe',
    '/seguridad',
    '/empresa/configuracion',
    '/firma-digital/configuracion',
    '/pagos/configuracion',
    '/contabilidad/integraciones',
    '/dashboard/integrations/crisp',
    '/dashboard/integrations/twilio',
]

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    
    print("Verificando rutas desplegadas...\n")
    
    results = []
    for route in ROUTES_TO_CHECK:
        stdin, stdout, stderr = client.exec_command(
            f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}"
        )
        stdout.channel.recv_exit_status()
        http_code = stdout.read().decode().strip()
        
        status = "✅" if http_code == "200" else "❌"
        results.append((route, http_code, status))
        print(f"{status} {route} -> {http_code}")
    
    client.close()
    
    # Resumen
    passed = sum(1 for _, code, _ in results if code == "200")
    total = len(results)
    print(f"\n{'='*50}")
    print(f"Resultado: {passed}/{total} rutas funcionando")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
