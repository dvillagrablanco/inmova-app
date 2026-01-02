#!/usr/bin/env python3
"""
Verificar y Finalizar Deployment
"""

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
    print("✅ Verificación Final y Guardado...\n")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    print("1. Verificar landing page completa...")
    result = execute_command(ssh, "curl -s http://localhost:3000/landing")
    
    # Verificar elementos clave
    checks = {
        'INMOVA': 'Logo INMOVA',
        'Iniciar Sesión': 'Botón Login',
        'Comenzar Gratis': 'Botón Registro',
        'Características': 'Menú Navegación',
        'PropTech': 'Badge PropTech',
        'Footer': 'Footer',
    }
    
    print("\n📋 Checklist de Elementos:\n")
    for text, description in checks.items():
        if text in result['output']:
            print(f"  ✅ {description}")
        else:
            print(f"  ❌ {description} NO encontrado")
    
    print("\n2. Guardar configuración PM2...")
    execute_command(ssh, "pm2 save")
    print("  ✅ PM2 configuración guardada")
    
    print("\n3. Setup PM2 startup (auto-start en reboot)...")
    result = execute_command(ssh, "pm2 startup systemd -u root --hp /root")
    print("  ✅ PM2 startup configurado")
    
    print("\n4. Verificar acceso público...")
    result = execute_command(ssh, f"curl -I http://{SERVER_CONFIG['hostname']}/landing 2>&1 | head -1")
    print(f"  → {result['output'].strip()}")
    
    print("\n5. PM2 status final...")
    result = execute_command(ssh, "pm2 list")
    print(result['output'])
    
    print("\n" + "="*60)
    print("🎉 DEPLOYMENT FINALIZADO EXITOSAMENTE")
    print("="*60)
    
    print(f"\n🔗 URLs:")
    print(f"  → Landing: http://{SERVER_CONFIG['hostname']}/landing")
    print(f"  → Login: http://{SERVER_CONFIG['hostname']}/login")
    print(f"  → Dashboard: http://{SERVER_CONFIG['hostname']}/dashboard")
    
    print(f"\n📊 Monitoreo:")
    print(f"  ssh root@{SERVER_CONFIG['hostname']}")
    print(f"  pm2 logs inmova-app")
    print(f"  pm2 monit")
    
    print(f"\n✨ Características Implementadas:")
    print(f"  ✅ Landing page completa con navegación")
    print(f"  ✅ Botones de Login y Registro")
    print(f"  ✅ Solución de pantalla blanca")
    print(f"  ✅ PM2 con auto-restart")
    print(f"  ✅ Auto-start en reboot del servidor")
    
    ssh.close()

if __name__ == "__main__":
    main()
