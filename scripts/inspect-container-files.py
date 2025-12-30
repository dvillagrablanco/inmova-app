#!/usr/bin/env python3
"""
Inspeccionar archivos dentro del contenedor Docker
para entender por qué sirve la landing antigua
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🔍 INSPECCIÓN DEL CONTENEDOR DOCKER")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    
    print("1️⃣  Estructura de directorios en /app")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final ls -la /app")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n2️⃣  Verificando si existe app/ dentro de /app")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final test -d /app/app && echo 'EXISTS' || echo 'NOT FOUND'")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8').strip()
    print(f"Directorio /app/app: {result}")
    
    if 'EXISTS' in result:
        print("\n   Listando /app/app:")
        _, out, _ = ssh.exec_command("docker exec inmova-app-final ls -la /app/app")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
        
        print("\n   Verificando /app/app/page.tsx:")
        _, out, _ = ssh.exec_command("docker exec inmova-app-final cat /app/app/page.tsx 2>&1 | head -20")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
    
    print("\n3️⃣  Verificando archivos en .next/server/app")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final ls -la /app/.next/server/app/ 2>&1 | head -30")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n4️⃣  Verificando page.html en .next/server/app")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final test -f /app/.next/server/app/page.html && echo 'EXISTS' || echo 'NOT FOUND'")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8').strip()
    print(f".next/server/app/page.html: {result}")
    
    if 'EXISTS' in result:
        print("\n   Contenido de page.html (primeras 50 líneas):")
        _, out, _ = ssh.exec_command("docker exec inmova-app-final cat /app/.next/server/app/page.html 2>&1 | head -50")
        out.channel.recv_exit_status()
        print(out.read().decode('utf-8'))
    
    print("\n5️⃣  Verificando /app/.next/server/app/landing")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final ls -la /app/.next/server/app/landing 2>&1 | head -20")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n6️⃣  Test directo al contenedor con curl")
    print("-" * 80)
    
    # Test sin seguir redirects
    _, out, _ = ssh.exec_command("docker exec inmova-app-final curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>'")
    out.channel.recv_exit_status()
    title = out.read().decode('utf-8').strip()
    print(f"Título en /: {title}")
    
    # Test a /landing directamente
    _, out, _ = ssh.exec_command("docker exec inmova-app-final curl -s http://localhost:3000/landing | grep -o '<title>[^<]*</title>'")
    out.channel.recv_exit_status()
    title_landing = out.read().decode('utf-8').strip()
    print(f"Título en /landing: {title_landing}")
    
    print("\n7️⃣  Verificando next.config.js")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final cat /app/next.config.js 2>&1 | grep -A 3 -B 3 'output\\|redirect'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n8️⃣  Verificando variables de entorno en el contenedor")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker exec inmova-app-final env | grep -E 'NODE_ENV|NEXT_|APP_URL'")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
    print("\n9️⃣  Logs de inicio del contenedor")
    print("-" * 80)
    _, out, _ = ssh.exec_command("docker logs inmova-app-final 2>&1 | grep -E 'ready|started|listening' | tail -10")
    out.channel.recv_exit_status()
    print(out.read().decode('utf-8'))
    
finally:
    ssh.close()

print("\n" + "="*80)
print("ANÁLISIS COMPLETADO")
print("="*80 + "\n")
