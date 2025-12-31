#!/usr/bin/env python3
"""
Limpiar todos los cachés y forzar landing nueva
"""
import paramiko, time

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🧹 LIMPIEZA DE CACHÉS Y ACTUALIZACIÓN")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado\n")
    
    # 1. Stop container
    print("1️⃣  Deteniendo contenedor...")
    _, out, _ = ssh.exec_command("docker stop inmova-app-npm")
    out.channel.recv_exit_status()
    print("✅ Detenido\n")
    
    # 2. Clean Next.js cache
    print("2️⃣  Limpiando cache de Next.js...")
    _, out, _ = ssh.exec_command("rm -rf /opt/inmova-app/.next/cache")
    out.channel.recv_exit_status()
    print("✅ Cache Next.js limpiado\n")
    
    # 3. Start container
    print("3️⃣  Reiniciando contenedor...")
    _, out, _ = ssh.exec_command("docker start inmova-app-npm")
    out.channel.recv_exit_status()
    print("✅ Reiniciado\n")
    
    # 4. Wait and verify
    print("4️⃣  Esperando que la app reinicie (20 seg)...")
    time.sleep(20)
    
    # 5. Test redirect
    print("\n5️⃣  Verificando redirect...")
    _, out, _ = ssh.exec_command("curl -sL http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"   Título página: {title}")
    
    # 6. Test /landing directly
    print("\n6️⃣  Verificando /landing directamente...")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/landing | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    landing_title = out.read().decode('utf-8').strip()
    print(f"   Título landing: {landing_title}")
    
    # 7. Check logs
    print("\n7️⃣  Logs recientes:")
    _, out, _ = ssh.exec_command("docker logs --tail 10 inmova-app-npm 2>&1 | grep -v 'NO_SECRET\\|next-auth'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8')[:400])
    
    print("\n" + "="*80)
    print("✅ CACHÉ LIMPIADO")
    print("="*80)
    print("\n🌐 AHORA NECESITAS LIMPIAR EL CACHÉ EN TU LADO:\n")
    print("1️⃣  CLOUDFLARE (si usas):")
    print("   • Ve a cloudflare.com")
    print("   • Caching > Purge Everything")
    print("\n2️⃣  TU NAVEGADOR:")
    print("   • Chrome/Edge: Ctrl + Shift + R (Windows) o Cmd + Shift + R (Mac)")
    print("   • Firefox: Ctrl + F5 (Windows) o Cmd + Shift + R (Mac)")
    print("   • Safari: Cmd + Option + R")
    print("\n3️⃣  O abre en modo incógnito:")
    print("   • Ctrl + Shift + N (Chrome)")
    print("   • Ctrl + Shift + P (Firefox)")
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
