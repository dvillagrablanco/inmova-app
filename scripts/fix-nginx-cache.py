#!/usr/bin/env python3
"""
Verificar y limpiar caché de Nginx
"""
import paramiko

HOST = "157.180.119.236"
USER = "root"
PASS = "xqxAkFdA33j3"

print("\n" + "="*80)
print("🔍 DIAGNÓSTICO Y LIMPIEZA DE NGINX")
print("="*80 + "\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, 22, USER, PASS, timeout=30)
    print("✅ Conectado al servidor\n")
    
    # 1. Verificar configuración de Nginx
    print("1️⃣  Verificando configuración de Nginx para inmovaapp.com...")
    _, out, _ = ssh.exec_command("cat /etc/nginx/sites-enabled/inmovaapp.com 2>&1")
    out.channel.recv_exit_status()
    nginx_config = out.read().decode('utf-8')
    
    # Buscar directivas de caché
    if 'proxy_cache' in nginx_config:
        print("   ⚠️  NGINX TIENE CACHÉ ACTIVADO")
        print("   Directivas encontradas:")
        for line in nginx_config.split('\n'):
            if 'cache' in line.lower() and not line.strip().startswith('#'):
                print(f"      {line.strip()}")
    else:
        print("   ✅ No se detecta proxy_cache en configuración")
    
    # 2. Buscar directorio de caché
    print("\n2️⃣  Buscando directorios de caché de Nginx...")
    _, out, _ = ssh.exec_command("find /var/cache/nginx -type d 2>/dev/null | head -10")
    out.channel.recv_exit_status()
    cache_dirs = out.read().decode('utf-8').strip()
    if cache_dirs:
        print("   ⚠️  Directorio de caché existe:")
        print(f"   {cache_dirs}")
    else:
        print("   ✅ No se encontró /var/cache/nginx")
    
    # 3. Verificar qué está sirviendo Nginx AHORA
    print("\n3️⃣  Verificando qué sirve Nginx actualmente...")
    _, out, _ = ssh.exec_command("curl -s -H 'Host: inmovaapp.com' http://localhost:80/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    nginx_title = out.read().decode('utf-8').strip()
    print(f"   Título desde Nginx: {nginx_title}")
    
    if 'INMOVA' in nginx_title or 'PropTech #1' in nginx_title:
        print("   ✅ Nginx sirve landing NUEVA")
    else:
        print("   ❌ Nginx sirve landing ANTIGUA")
    
    # 4. Verificar qué sirve la app directamente
    print("\n4️⃣  Verificando qué sirve la app (puerto 3000) directamente...")
    _, out, _ = ssh.exec_command("curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    app_title = out.read().decode('utf-8').strip()
    print(f"   Título desde App: {app_title}")
    
    if 'INMOVA' in app_title or 'PropTech #1' in app_title:
        print("   ✅ App sirve landing NUEVA")
    else:
        print("   ❌ App sirve landing ANTIGUA")
    
    # 5. Limpiar caché de Nginx si existe
    print("\n5️⃣  Limpiando caché de Nginx...")
    _, out, err = ssh.exec_command("rm -rf /var/cache/nginx/* 2>&1")
    out.channel.recv_exit_status()
    result = out.read().decode('utf-8')
    if result:
        print(f"   {result}")
    else:
        print("   ✅ Caché limpiado (o no existía)")
    
    # 6. Verificar configuración de caché en Nginx
    print("\n6️⃣  Verificando si hay proxy_cache_path configurado...")
    _, out, _ = ssh.exec_command("grep -r 'proxy_cache_path' /etc/nginx/ 2>/dev/null")
    out.channel.recv_exit_status()
    cache_path = out.read().decode('utf-8').strip()
    if cache_path:
        print("   ⚠️  Encontrado proxy_cache_path:")
        print(f"   {cache_path}")
        
        # Extraer ruta del caché
        if 'proxy_cache_path' in cache_path:
            cache_dir = cache_path.split()[1] if len(cache_path.split()) > 1 else None
            if cache_dir:
                print(f"\n   Limpiando {cache_dir}...")
                _, out, _ = ssh.exec_command(f"rm -rf {cache_dir}/* 2>&1")
                out.channel.recv_exit_status()
                print("   ✅ Limpiado")
    else:
        print("   ✅ No hay proxy_cache_path configurado")
    
    # 7. Recargar Nginx
    print("\n7️⃣  Recargando Nginx...")
    _, out, _ = ssh.exec_command("nginx -t && systemctl reload nginx 2>&1")
    out.channel.recv_exit_status()
    reload_result = out.read().decode('utf-8')
    if 'successful' in reload_result or 'ok' in reload_result.lower():
        print("   ✅ Nginx recargado exitosamente")
    else:
        print(f"   Resultado: {reload_result}")
    
    # 8. Verificar de nuevo después de limpiar
    print("\n8️⃣  Verificando después de limpieza...")
    import time
    time.sleep(2)
    
    _, out, _ = ssh.exec_command("curl -s -H 'Host: inmovaapp.com' http://localhost:80/ | grep -o '<title>[^<]*</title>' | head -1")
    out.channel.recv_exit_status()
    new_title = out.read().decode('utf-8').strip()
    print(f"   Título actual: {new_title}")
    
    # 9. Verificar headers de respuesta
    print("\n9️⃣  Verificando headers de respuesta...")
    _, out, _ = ssh.exec_command("curl -sI -H 'Host: inmovaapp.com' http://localhost:80/ | grep -i cache")
    out.channel.recv_exit_status()
    cache_headers = out.read().decode('utf-8').strip()
    if cache_headers:
        print("   Headers de caché encontrados:")
        print(f"   {cache_headers}")
    else:
        print("   ✅ No hay headers de caché")
    
    print("\n" + "="*80)
    print("✅ LIMPIEZA COMPLETA")
    print("="*80)
    
    print("\n📋 RESUMEN:")
    print(f"   Nginx (puerto 80): {nginx_title}")
    print(f"   App (puerto 3000): {app_title}")
    print(f"   Después limpieza: {new_title}")
    
    if 'INMOVA' in new_title or 'PropTech #1' in new_title:
        print("\n✅ AHORA NGINX SIRVE LA LANDING NUEVA")
        print("\n🔄 SIGUIENTE PASO:")
        print("   1. Abre navegador en modo incógnito")
        print("   2. Ve a: https://inmovaapp.com")
        print("   3. Si CLOUDFLARE sigue cacheando, purga desde su dashboard")
    else:
        print("\n⚠️  PROBLEMA PERSISTE")
        print("   Necesitamos revisar más a fondo la configuración")
    
    print("\n" + "="*80 + "\n")
    
finally:
    ssh.close()
