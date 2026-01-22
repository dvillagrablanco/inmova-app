#!/usr/bin/env python3
"""Quick SSH Deployment"""
import os
import paramiko
import time

HOST = "157.180.119.236"
USER = "root"
PASS = os.getenv("SSH_PASSWORD", "")  # Set via environment variable

def run(ssh, cmd, timeout=300):
    print(f"\n>>> {cmd[:80]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        for line in out.strip().split('\n')[-20:]:
            print(f"    {line}")
    if exit_code != 0 and err.strip():
        print(f"    ERR: {err[:200]}")
    return exit_code, out, err

print("\n🚀 DEPLOYMENT SSH - INMOVA APP\n")
print(f"Servidor: {USER}@{HOST}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("\n1️⃣ Conectando...")
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado\n")
    
    print("2️⃣ Verificando sistema...")
    run(ssh, "uname -a")
    run(ssh, "free -h | grep Mem")
    run(ssh, "df -h / | tail -1")
    
    print("\n3️⃣ Verificando Docker...")
    code, out, _ = run(ssh, "docker --version")
    if code != 0:
        print("Instalando Docker...")
        run(ssh, "apt update && apt install -y docker.io docker-compose", timeout=300)
        run(ssh, "systemctl start docker && systemctl enable docker")
    
    print("\n4️⃣ Verificando repositorio...")
    code, _, _ = run(ssh, "test -d /opt/inmova-app/.git && echo 'OK'")
    
    if code != 0:
        print("Clonando repositorio...")
        run(ssh, "mkdir -p /opt")
        run(ssh, "cd /opt && git clone https://github.com/dvillagrablanco/inmova-app.git", timeout=300)
    else:
        print("Actualizando repositorio...")
        run(ssh, "cd /opt/inmova-app && git fetch origin && git reset --hard origin/main")
    
    print("\n5️⃣ Verificando .env.production...")
    code, _, _ = run(ssh, "test -f /opt/inmova-app/.env.production")
    if code != 0:
        print("Creando .env.production básico...")
        env = '''DATABASE_URL="postgresql://dummy@localhost:5432/db"
NEXTAUTH_URL="http://157.180.119.236:3000"
NEXTAUTH_SECRET="inmova-secret-key-2026"
NODE_ENV="production"
SKIP_ENV_VALIDATION="1"'''
        run(ssh, f'echo \'{env}\' > /opt/inmova-app/.env.production')
    
    print("\n6️⃣ Deteniendo contenedores anteriores...")
    run(ssh, "docker stop inmova-app-production 2>/dev/null || true")
    run(ssh, "docker rm inmova-app-production 2>/dev/null || true")
    run(ssh, "docker system prune -f 2>/dev/null || true")
    
    print("\n7️⃣ Construyendo imagen Docker (5-10 min)...")
    code, out, err = run(ssh, 
        "cd /opt/inmova-app && docker build --no-cache -t inmova-app:production . 2>&1 | tail -40", 
        timeout=900)
    
    if code != 0:
        print(f"❌ Error en build: {err[:500]}")
        print("\nÚltimos logs:")
        run(ssh, "cd /opt/inmova-app && docker build -t inmova-app:production . 2>&1 | tail -60")
        exit(1)
    
    print("\n✅ Imagen construida")
    
    print("\n8️⃣ Iniciando contenedor...")
    run(ssh, """docker run -d \
        --name inmova-app-production \
        --env-file /opt/inmova-app/.env.production \
        --restart unless-stopped \
        -p 3000:3000 \
        inmova-app:production""")
    
    print("\n9️⃣ Esperando arranque (30s)...")
    time.sleep(30)
    
    print("\n🔟 Verificando estado...")
    code, out, _ = run(ssh, "docker ps | grep inmova-app")
    
    if 'Up' in out:
        print("\n✅ CONTENEDOR CORRIENDO")
        
        print("\nHealth check...")
        for i in range(3):
            code, out, _ = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --max-time 10")
            if '200' in out or '302' in out:
                print(f"✅ HTTP OK ({out.strip()})")
                break
            time.sleep(10)
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║  ✅ DEPLOYMENT COMPLETADO                                    ║
╚══════════════════════════════════════════════════════════════╝

🌐 URL: http://157.180.119.236:3000

Comandos útiles:
  • Ver logs: docker logs -f inmova-app-production
  • Reiniciar: docker restart inmova-app-production
  • Shell: docker exec -it inmova-app-production sh
        """)
    else:
        print("\n❌ Contenedor no está corriendo")
        print("\nLogs del contenedor:")
        run(ssh, "docker logs --tail 50 inmova-app-production 2>&1")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    ssh.close()
    print("\nConexión cerrada")
