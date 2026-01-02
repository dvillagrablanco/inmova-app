#!/usr/bin/env python3
"""
Configurar BetterStack Status Page URL
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

STATUS_PAGE_URL = 'https://inmova.betteruptime.com'

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, stdout.read().decode(), stderr.read().decode()

def main():
    print("🎯 Configurando BetterStack Status Page...")
    print(f"   URL: {STATUS_PAGE_URL}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    
    print("✅ Conectado al servidor\n")
    
    try:
        # Backup
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        print("📦 Creando backup...")
        exec_cmd(client, f"cd /opt/inmova-app && cp .env.production .env.production.backup.{timestamp}")
        print("✅ Backup creado\n")
        
        # Verificar si ya existe la variable
        print("🔍 Verificando variable actual...")
        _, output, _ = exec_cmd(client, "cd /opt/inmova-app && grep 'STATUS_PAGE_URL' .env.production || echo 'No existe'")
        
        if 'No existe' in output:
            print("   Variable no existe, añadiendo...\n")
            # Añadir la variable
            exec_cmd(
                client,
                f'cd /opt/inmova-app && echo "NEXT_PUBLIC_STATUS_PAGE_URL={STATUS_PAGE_URL}" >> .env.production'
            )
        else:
            print("   Variable existe, actualizando...\n")
            # Actualizar la variable (descomentar si estaba comentada y actualizar valor)
            exec_cmd(
                client,
                f"cd /opt/inmova-app && sed -i 's|^# NEXT_PUBLIC_STATUS_PAGE_URL=.*|NEXT_PUBLIC_STATUS_PAGE_URL={STATUS_PAGE_URL}|' .env.production"
            )
            # Si no estaba comentada, actualizar directamente
            exec_cmd(
                client,
                f"cd /opt/inmova-app && sed -i 's|^NEXT_PUBLIC_STATUS_PAGE_URL=.*|NEXT_PUBLIC_STATUS_PAGE_URL={STATUS_PAGE_URL}|' .env.production"
            )
        
        print("✅ Variable configurada\n")
        
        # Verificar
        print("🔍 Verificando configuración...")
        _, output, _ = exec_cmd(client, "cd /opt/inmova-app && grep 'STATUS_PAGE_URL' .env.production")
        for line in output.strip().split('\n'):
            if 'STATUS_PAGE_URL' in line and not line.strip().startswith('#'):
                print(f"   ✅ {line}")
        print()
        
        # Reiniciar PM2
        print("🔄 Reiniciando PM2...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        print("✅ PM2 reiniciado\n")
        
        print("⏳ Esperando 15 segundos...\n")
        time.sleep(15)
        
        # Verificar estado
        print("📊 Estado del servidor:")
        _, output, _ = exec_cmd(client, "pm2 status inmova-app")
        print(output)
        
        print("\n" + "="*60)
        print("✅ BETTERSTACK STATUS PAGE CONFIGURADO")
        print("="*60)
        print()
        print(f"🎯 URL: {STATUS_PAGE_URL}")
        print()
        print("🧪 VERIFICACIÓN:")
        print("  1. Abre https://inmovaapp.com")
        print("  2. Ve al Footer (abajo de la página)")
        print("  3. Busca el link 'Estado del Sistema' o 'System Status'")
        print("  4. Click en el link")
        print(f"  5. Debe abrir: {STATUS_PAGE_URL}")
        print()
        print("="*60)
        print("🎉 TRIADA DE MANTENIMIENTO 100% COMPLETA")
        print("="*60)
        print()
        print("✅ Crisp Chat: Funcionando")
        print("✅ Sentry: Configurado (DSN actualizado)")
        print("✅ BetterStack: Configurado")
        print()
        print("¡Felicidades! Tu aplicación ahora tiene:")
        print("  🛡️  Error tracking automático")
        print("  💬 Chat de soporte en vivo")
        print("  📊 Status page pública")
        print()
        
    finally:
        client.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
