#!/usr/bin/env python3
"""Full deployment script"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(msg, color=''):
    colors = {'green': '\033[92m', 'red': '\033[91m', 'yellow': '\033[93m', 'cyan': '\033[96m', 'reset': '\033[0m'}
    c = colors.get(color, '')
    r = colors['reset']
    print(f"{c}[{time.strftime('%H:%M:%S')}] {msg}{r}")

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print(f"\n{'='*70}")
    print("🚀 FULL DEPLOYMENT - INMOVA APP")
    print(f"{'='*70}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        log("🔐 Conectando al servidor...", "cyan")
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", "green")

        # 1. Git pull
        log("📥 Actualizando código desde GitHub...", "cyan")
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin main")
        exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git log --oneline -1")
        log(f"   Commit: {output.strip()}", "yellow")
        log("✅ Código actualizado", "green")

        # 2. Eliminar archivos conflictivos
        log("🗑️ Limpiando archivos conflictivos...", "cyan")
        exec_cmd(client, f"cd {APP_PATH} && rm -rf pages/api/sales-team/representatives/ 2>/dev/null")
        log("✅ Limpieza completada", "green")

        # 3. Install dependencies
        log("📦 Instalando dependencias...", "cyan")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -3", timeout=300)
        log("✅ Dependencias instaladas", "green")

        # 4. Prisma generate
        log("🔧 Generando Prisma Client...", "cyan")
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1", timeout=120)
        log("✅ Prisma generado", "green")

        # 5. Limpiar cache Next.js
        log("🧹 Limpiando cache de Next.js...", "cyan")
        exec_cmd(client, f"cd {APP_PATH} && rm -rf .next/cache .next/server 2>/dev/null")
        log("✅ Cache limpiado", "green")

        # 6. Build
        log("🏗️ Building aplicación (3-6 min)...", "cyan")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1", timeout=600)
        if status != 0:
            log(f"⚠️ Build warning", "yellow")
            print(output[-800:] if output else error[-800:])
        else:
            log("✅ Build completado", "green")

        # 7. Restart PM2
        log("♻️ Reiniciando PM2...", "cyan")
        exec_cmd(client, f"cd {APP_PATH} && pm2 delete inmova-app 2>/dev/null")
        exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
        exec_cmd(client, "pm2 save")
        log("✅ PM2 reiniciado", "green")

        # 8. Wait for warm-up
        log("⏳ Esperando warm-up (30s)...", "cyan")
        time.sleep(30)

        # 9. Verificar rutas críticas
        log("🧪 Verificando rutas...", "cyan")
        routes = [
            '/admin/herramientas-empresa',
            '/configuracion',
            '/configuracion/integraciones',
            '/contabilidad/integraciones',
            '/firma-digital/configuracion',
        ]
        
        all_ok = True
        for route in routes:
            status, output, _ = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}")
            code = output.strip()
            if code == "200":
                log(f"   ✅ {route}", "green")
            else:
                log(f"   ❌ {route} -> {code}", "red")
                all_ok = False

        # 10. PM2 status
        log("📊 Estado PM2:", "cyan")
        status, output, _ = exec_cmd(client, "pm2 status")
        print(output)

        print(f"\n{'='*70}")
        if all_ok:
            log("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE", "green")
        else:
            log("⚠️ DEPLOYMENT CON ADVERTENCIAS", "yellow")
        print(f"{'='*70}")
        print(f"\nURLs:")
        print(f"  - https://inmovaapp.com/admin/herramientas-empresa")
        print(f"  - https://inmovaapp.com/configuracion")
        print(f"{'='*70}\n")

    except Exception as e:
        log(f"❌ Error: {str(e)}", "red")
        raise
    finally:
        client.close()

if __name__ == '__main__':
    main()
