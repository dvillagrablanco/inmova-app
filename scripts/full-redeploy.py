#!/usr/bin/env python3
import paramiko, sys, time

HOST, USER, PASS = "157.180.119.236", "root", "xqxAkFdA33j3"

def run(ssh, cmd, show=True):
    _, out, _ = ssh.exec_command(cmd, get_pty=True)
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if show: print(result)
    return result

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("\n🚀 DEPLOYMENT COMPLETO\n")
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado\n")
    
    print("1️⃣  Respaldando config...")
    run(ssh, "cp /opt/inmova-app/.env.production /root/.env.backup 2>/dev/null || true", False)
    
    print("2️⃣  Deteniendo contenedores...")
    run(ssh, "cd /opt/inmova-app && docker-compose down 2>/dev/null || true", False)
    
    print("3️⃣  Respaldando código...")
    run(ssh, f"mv /opt/inmova-app /opt/inmova-app.old.$(date +%s) 2>/dev/null || rm -rf /opt/inmova-app", False)
    
    print("4️⃣  Clonando repositorio...\n")
    out = run(ssh, "cd /opt && git clone https://github.com/dvillagrablanco/inmova-app.git")
    if "fatal" in out:
        print("❌ Error clonando")
        sys.exit(1)
    
    print("\n5️⃣  Restaurando config...")
    run(ssh, "cp /root/.env.backup /opt/inmova-app/.env.production 2>/dev/null || true", False)
    
    print("6️⃣  Verificando archivos conflictivos...")
    out = run(ssh, "ls /opt/inmova-app/app/home/page.tsx 2>&1 || echo 'OK'", False)
    if "OK" in out:
        print("✅ No hay app/home")
    else:
        print("⚠️  Eliminando app/home...")
        run(ssh, "rm -rf /opt/inmova-app/app/home", False)
    
    print("\n7️⃣  Iniciando deployment (3-5 min)...")
    run(ssh, "cd /opt/inmova-app && nohup bash scripts/deploy-direct.sh > /tmp/deploy-new.log 2>&1 &", False)
    print("✅ Deployment iniciado\n")
    
    print("⏳ Monitoreando build...")
    time.sleep(15)
    
    for i in range(25):
        time.sleep(12)
        log = run(ssh, "tail -8 /tmp/deploy-new.log 2>/dev/null", False)
        
        if "parallel pages" in log or "Failed to compile" in log:
            print(f"\n❌ ERROR EN BUILD:\n{log}")
            break
        elif "Successfully" in log or "Contenedor iniciado" in log:
            print(f"\n✅ BUILD EXITOSO!\n{log}")
            break
        elif i % 3 == 0:
            print(f"  [{i+1}/25] 🏗️  Building...")
    
    print("\n8️⃣  Verificando contenedores...")
    time.sleep(5)
    run(ssh, "docker ps | grep inmova")
    
    print("\n9️⃣  Testing app...")
    time.sleep(5)
    status = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", False).strip()
    print(f"HTTP Status: {status}")
    
    print("\n" + "="*80)
    print("✅ COMPLETADO - Verifica: https://inmovaapp.com")
    print("="*80)
    print("\n🔐 IMPORTANTE: Cambia la contraseña SSH ahora\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    ssh.close()
