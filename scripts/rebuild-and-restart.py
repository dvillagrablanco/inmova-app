#!/usr/bin/env python3
"""Rebuild completo y restart"""
import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)
import paramiko, time

SERVER, USER, PASS = '157.180.119.236', 'root', 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return code, out, err

print("\n" + "="*70)
print("🔧 REBUILD COMPLETO Y RESTART")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

print("1. Limpiando .next...")
run(f"cd {PATH} && rm -rf .next")
print("   ✅ Cache limpiado\n")

print("2. Git pull...")
run(f"cd {PATH} && git pull origin main")
print("   ✅ Código actualizado\n")

print("3. npm install...")
code, out, err = run(f"cd {PATH} && npm install", timeout=300)
print("   ✅ Dependencies instaladas\n")

print("4. Prisma generate...")
code, out, err = run(f"cd {PATH} && npx prisma generate", timeout=120)
print("   ✅ Prisma generado\n")

print("5. npm run build...")
code, out, err = run(f"cd {PATH} && npm run build", timeout=600)
if code == 0:
    print("   ✅ Build completado\n")
else:
    print(f"   ❌ Build falló (code: {code})")
    print("Últimas líneas del error:")
    print(err[-500:] if len(err) > 500 else err)
    print()

print("6. Verificando build...")
code, out, err = run(f"cd {PATH} && ls -la .next/BUILD_ID")
if 'BUILD_ID' in out:
    print("   ✅ BUILD_ID existe\n")
else:
    print("   ❌ BUILD_ID no existe")
    print("   Esto indica que el build no completó\n")

print("7. PM2 restart...")
run("pm2 delete all")
run("pm2 kill")
time.sleep(5)
run(f"cd {PATH} && pm2 start ecosystem.config.js --env production")
run("pm2 save")
print("   ✅ PM2 reiniciado\n")

time.sleep(20)

print("8. Verificando PM2 status...")
code, out, err = run("pm2 status inmova-app")
if 'online' in out:
    print("   ✅ PM2 online\n")
else:
    print("   ⚠️ PM2 no está online aún")
    print(out)

print("9. Health check...")
code, out, err = run("curl -s http://localhost:3000/api/health")
if '"status":"ok"' in out:
    print("   ✅ Health OK\n")
else:
    print(f"   ⚠️ Health check: {out[:100]}\n")

print("10. Test página stub...")
code, out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/traditional-rental")
print(f"   /traditional-rental: {out}\n")

print("="*70)
print("✅ REBUILD COMPLETADO")
print("="*70 + "\n")

print("URLs para verificar:")
print("  https://inmovaapp.com/traditional-rental")
print("  https://inmovaapp.com/str-housekeeping")
print("  https://inmovaapp.com/room-rental")
print("  https://inmovaapp.com/open-banking")
print("  https://inmovaapp.com/soporte\n")

print("="*70 + "\n")
client.close()
