#!/usr/bin/env python3
"""
Script para limpiar PM2 y verificar la aplicación
"""

import sys
import time
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    return exit_status, output, error

def main():
    log("🔐 Conectando...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado")
    
    try:
        # Limpiar PM2
        log("🧹 Limpiando procesos PM2 errored...")
        exec_cmd(client, "pm2 delete all")
        time.sleep(2)
        
        # Reiniciar con ecosystem.config.js limpio
        log("🚀 Reiniciando con una sola instancia...")
        status, output, error = exec_cmd(
            client,
            "cd /opt/inmova-app && pm2 start npm --name inmova-app -- start",
            timeout=60
        )
        log(f"PM2 start: {output}")
        
        # Guardar
        exec_cmd(client, "pm2 save")
        
        # Esperar
        log("⏳ Esperando 20 segundos...")
        time.sleep(20)
        
        # Verificar status
        status, output, error = exec_cmd(client, "pm2 list")
        print("\n" + output + "\n")
        
        # Health check
        log("🏥 Health check...")
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        log(f"Health: {output}")
        
        # Verificar páginas
        log("📄 Verificando páginas...")
        pages = [
            "/servicios-limpieza",
            "/energia-solar", 
            "/instalaciones-deportivas",
            "/sincronizacion-avanzada",
            "/informes"
        ]
        
        for page in pages:
            status, output, error = exec_cmd(
                client,
                f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{page}"
            )
            code = output.strip()
            if code == "200":
                log(f"  ✅ {page}: {code}")
            else:
                log(f"  ⚠️ {page}: {code}")
        
        log("✅ Verificación completada")
        
    finally:
        client.close()
        log("🔒 Conexión cerrada")

if __name__ == "__main__":
    main()
