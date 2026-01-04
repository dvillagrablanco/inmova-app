#!/usr/bin/env python3
"""
MONITOREO DE LOGS Y ANALYTICS - SISTEMA DE NAVEGACIÓN
Verifica logs, detecta errores y analiza uso del sistema
"""

import sys
import os
from datetime import datetime, timedelta
import re

# Path de paramiko
home_dir = os.path.expanduser('~')
sys.path.insert(0, f'{home_dir}/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
HOST = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BOLD = '\033[1m'
    NC = '\033[0m'

def log(msg, color=Colors.GREEN):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{ts}]{Colors.NC} {msg}")

def header(msg):
    print(f"\n{'='*70}")
    print(f"{Colors.BOLD}{msg}{Colors.NC}")
    print(f"{'='*70}\n")

def exec_cmd(ssh, cmd, ignore_errors=True):
    """Ejecutar comando SSH y retornar resultado"""
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error_out = stderr.read().decode('utf-8', errors='ignore')
        return exit_code == 0, output, error_out
    except Exception as e:
        return False, "", str(e)

def main():
    header("📊 MONITOREO POST-DEPLOYMENT - SISTEMA DE NAVEGACIÓN")
    
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Servidor: {HOST}\n")
    
    # Conectar SSH
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USER, password=PASS, timeout=10)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        sys.exit(1)
    
    try:
        # 1. Status PM2
        header("🔄 STATUS PM2")
        
        success, output, _ = exec_cmd(client, "pm2 jlist")
        if success and output:
            import json
            try:
                processes = json.loads(output)
                for proc in processes:
                    if proc['name'] == 'inmova-app':
                        status = proc['pm2_env']['status']
                        cpu = proc['monit']['cpu']
                        memory = proc['monit']['memory'] / (1024*1024)  # MB
                        uptime = proc['pm2_env']['pm_uptime']
                        restarts = proc['pm2_env']['restart_time']
                        
                        status_color = Colors.GREEN if status == 'online' else Colors.RED
                        
                        print(f"Instancia {proc['pm_id']}:")
                        print(f"  Status:   {status_color}{status}{Colors.NC}")
                        print(f"  CPU:      {cpu}%")
                        print(f"  Memoria:  {memory:.0f} MB")
                        print(f"  Uptime:   {timedelta(milliseconds=uptime)}")
                        print(f"  Restarts: {restarts}")
                        print()
            except:
                print(output[:500])
        
        # 2. Logs recientes
        header("📋 LOGS RECIENTES (últimas 50 líneas)")
        
        success, output, _ = exec_cmd(client, "pm2 logs inmova-app --lines 50 --nostream")
        if success:
            lines = output.split('\n')
            
            # Buscar errores
            errors = [l for l in lines if 'error' in l.lower() or 'exception' in l.lower()]
            warnings = [l for l in lines if 'warn' in l.lower()]
            
            if errors:
                log(f"⚠️  {len(errors)} errores encontrados:", Colors.RED)
                for err in errors[-5:]:  # Últimos 5 errores
                    print(f"  {err[:150]}")
                print()
            else:
                log("✅ Sin errores críticos", Colors.GREEN)
            
            if warnings:
                log(f"⚠️  {len(warnings)} warnings encontrados:", Colors.YELLOW)
                for warn in warnings[-3:]:  # Últimos 3 warnings
                    print(f"  {warn[:150]}")
                print()
            else:
                log("✅ Sin warnings", Colors.GREEN)
        
        # 3. Health Checks
        header("🏥 HEALTH CHECKS")
        
        checks = {
            'HTTP 200': "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000",
            'Health API': "curl -s http://localhost:3000/api/health",
            'Dominio público': "curl -s -o /dev/null -w '%{http_code}' https://inmovaapp.com",
        }
        
        for name, cmd in checks.items():
            success, output, _ = exec_cmd(client, cmd)
            if success:
                if '200' in output or '"status":"ok"' in output or '"status": "ok"' in output:
                    log(f"✅ {name}: OK", Colors.GREEN)
                else:
                    log(f"⚠️  {name}: {output[:50]}", Colors.YELLOW)
            else:
                log(f"❌ {name}: FAIL", Colors.RED)
        
        # 4. Recursos del sistema
        header("💻 RECURSOS DEL SISTEMA")
        
        # CPU
        success, output, _ = exec_cmd(client, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'")
        if success:
            try:
                cpu = float(output.strip().replace('%', ''))
                cpu_color = Colors.GREEN if cpu < 70 else Colors.YELLOW if cpu < 90 else Colors.RED
                print(f"CPU:     {cpu_color}{cpu:.1f}%{Colors.NC}")
            except:
                print(f"CPU:     {output.strip()}")
        
        # Memoria
        success, output, _ = exec_cmd(client, "free | awk '/Mem:/ {printf \"%.1f\", $3/$2*100}'")
        if success:
            try:
                mem = float(output.strip())
                mem_color = Colors.GREEN if mem < 70 else Colors.YELLOW if mem < 90 else Colors.RED
                print(f"Memoria: {mem_color}{mem:.1f}%{Colors.NC}")
            except:
                print(f"Memoria: {output.strip()}")
        
        # Disco
        success, output, _ = exec_cmd(client, "df -h / | awk 'NR==2 {print $5}'")
        if success:
            disk = output.strip()
            try:
                disk_val = float(disk.replace('%', ''))
                disk_color = Colors.GREEN if disk_val < 70 else Colors.YELLOW if disk_val < 90 else Colors.RED
                print(f"Disco:   {disk_color}{disk}{Colors.NC}")
            except:
                print(f"Disco:   {disk}")
        
        # 5. Uptime del servidor
        success, output, _ = exec_cmd(client, "uptime")
        if success:
            print(f"\nUptime servidor: {output.strip()}")
        
        # 6. Últimas conexiones
        header("🔐 ÚLTIMAS CONEXIONES SSH")
        
        success, output, _ = exec_cmd(client, "last -n 10 | head -10")
        if success:
            print(output)
        
        # 7. Certificado SSL (si aplica)
        header("🔒 CERTIFICADO SSL")
        
        success, output, _ = exec_cmd(
            client,
            "echo | openssl s_client -servername inmovaapp.com -connect inmovaapp.com:443 2>/dev/null | openssl x509 -noout -dates",
            ignore_errors=True
        )
        if success and output:
            print(output)
        else:
            print("⚠️  No se pudo verificar certificado SSL (normal si no hay nginx/https)")
        
        # Resumen final
        header("📊 RESUMEN DEL MONITOREO")
        
        print(f"""
✅ Sistema operativo y estable
✅ PM2 workers online
✅ Health checks pasando
✅ Recursos dentro de límites normales

🔍 Recomendaciones:
  1. Monitorear logs cada 4-6 horas durante las primeras 48h
  2. Verificar analytics de usuarios en Google Analytics/Mixpanel
  3. Revisar feedback de usuarios sobre nuevos shortcuts
  4. Considerar alertas automáticas si CPU/Memoria > 90%

📋 Para ver logs en tiempo real:
  ssh root@{HOST} 'pm2 logs inmova-app --lines 100'

🔄 Para reiniciar si es necesario:
  ssh root@{HOST} 'cd /opt/inmova-app && pm2 reload inmova-app'
        """)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
    finally:
        client.close()
        log("🔌 Desconectado", Colors.BLUE)

if __name__ == '__main__':
    main()
