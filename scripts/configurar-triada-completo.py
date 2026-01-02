#!/usr/bin/env python3
"""
Script completo para configurar la Triada paso a paso
Abre URLs automáticamente y configura todo en el servidor
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import re
import time
import webbrowser

# Credenciales del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "xcc9brgkMMbf"
APP_DIR = "/opt/inmova-app"

def print_box(title, content):
    """Imprime un box bonito"""
    width = 70
    print("\n" + "=" * width)
    print(f"  {title}")
    print("=" * width)
    for line in content.split('\n'):
        print(line)
    print("=" * width)

def validar_sentry_dsn(dsn):
    """Valida formato de Sentry DSN"""
    pattern = r'^https://[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io/\d+$'
    return re.match(pattern, dsn) is not None

def validar_crisp_id(uuid):
    """Valida formato de Crisp Website ID"""
    pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
    return re.match(pattern, uuid) is not None

def validar_url(url):
    """Valida formato de URL"""
    return url.startswith('http://') or url.startswith('https://')

def obtener_sentry_dsn():
    """Guía para obtener Sentry DSN"""
    print_box(
        "PASO 1/3: SENTRY DSN (Error Tracking)",
        """
🔴 Sentry captura automáticamente TODOS los errores de tu app

Pasos:
1. Abre: https://sentry.io/signup/
2. Regístrate con email o GitHub
3. Plan "Developer" (GRATIS, 5,000 errores/mes)
4. Click "Create Project"
5. Plataforma: "Next.js"
6. Nombre: "inmova-app"
7. COPIA EL DSN (formato: https://xxx@yyy.ingest.sentry.io/zzz)
"""
    )
    
    # Abrir navegador
    try:
        print("\n🌐 Abriendo Sentry en tu navegador...")
        webbrowser.open('https://sentry.io/signup/')
        print("   ✅ Navegador abierto")
    except:
        print("   ⚠️  No se pudo abrir el navegador automáticamente")
        print("   Abre manualmente: https://sentry.io/signup/")
    
    print("\n" + "-" * 70)
    print("⏸️  Completa el registro y crea el proyecto...")
    print("-" * 70)
    
    while True:
        dsn = input("\n📋 Pega tu Sentry DSN aquí: ").strip()
        
        if not dsn:
            print("❌ El DSN no puede estar vacío")
            continue
        
        if validar_sentry_dsn(dsn):
            print("✅ Sentry DSN válido!")
            return dsn
        else:
            print("❌ Formato inválido")
            print("   Formato correcto: https://[key]@[org].ingest.sentry.io/[id]")
            print("   Ejemplo: https://abc123@sentry.ingest.io/12345")
            
            retry = input("\n¿Intentar de nuevo? (s/n): ").lower()
            if retry != 's':
                print("⏭️  Saltando Sentry...")
                return None

def obtener_crisp_id():
    """Guía para obtener Crisp Website ID"""
    print_box(
        "PASO 2/3: CRISP WEBSITE ID (Chat de Soporte)",
        """
💬 Crisp permite soporte 24/7 a tus usuarios

Pasos:
1. Abre: https://crisp.chat/
2. Click "Try Crisp Free"
3. Regístrate con email
4. Completa el onboarding:
   - Nombre del sitio: "Inmova App"
   - URL: https://inmovaapp.com
5. Ve a Settings (⚙️) → Website Settings
6. Click "Setup Instructions"
7. COPIA EL WEBSITE ID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
"""
    )
    
    # Abrir navegador
    try:
        print("\n🌐 Abriendo Crisp en tu navegador...")
        webbrowser.open('https://crisp.chat/')
        print("   ✅ Navegador abierto")
    except:
        print("   ⚠️  No se pudo abrir el navegador automáticamente")
        print("   Abre manualmente: https://crisp.chat/")
    
    print("\n" + "-" * 70)
    print("⏸️  Completa el registro y obtén el Website ID...")
    print("-" * 70)
    
    while True:
        uuid = input("\n📋 Pega tu Crisp Website ID aquí: ").strip()
        
        if not uuid:
            print("❌ El Website ID no puede estar vacío")
            continue
        
        if validar_crisp_id(uuid):
            print("✅ Crisp Website ID válido!")
            return uuid
        else:
            print("❌ Formato inválido")
            print("   Formato correcto: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID)")
            print("   Ejemplo: 12345678-1234-1234-1234-123456789abc")
            
            retry = input("\n¿Intentar de nuevo? (s/n): ").lower()
            if retry != 's':
                print("⏭️  Saltando Crisp...")
                return None

def obtener_status_page_url():
    """Guía para obtener BetterStack Status Page URL"""
    print_box(
        "PASO 3/3: BETTERSTACK STATUS PAGE (Transparencia)",
        """
📊 Status Page muestra si tu app está operativa o caída

Pasos:
1. Abre: https://betterstack.com/uptime
2. Click "Start Free"
3. Regístrate con email
4. Click "Add Monitor":
   - URL: https://inmovaapp.com/api/health
   - Name: Inmova App
   - Check frequency: 3 minutos
   - Click "Create Monitor"
5. Menú lateral → "Status Pages"
6. Click "Create Status Page":
   - Name: Inmova Status
   - Selecciona el monitor que creaste
   - Subdomain: "inmova" (o el que prefieras)
   - Click "Create Status Page"
7. COPIA LA URL PÚBLICA (ej: https://inmova.betteruptime.com)
"""
    )
    
    # Abrir navegador
    try:
        print("\n🌐 Abriendo BetterStack en tu navegador...")
        webbrowser.open('https://betterstack.com/uptime')
        print("   ✅ Navegador abierto")
    except:
        print("   ⚠️  No se pudo abrir el navegador automáticamente")
        print("   Abre manualmente: https://betterstack.com/uptime")
    
    print("\n" + "-" * 70)
    print("⏸️  Completa el setup del monitor y Status Page...")
    print("-" * 70)
    
    while True:
        url = input("\n📋 Pega la URL de tu Status Page aquí: ").strip()
        
        if not url:
            print("⏭️  Saltando Status Page...")
            print("   (Puedes configurarlo después)")
            return None
        
        if validar_url(url):
            print("✅ Status Page URL válida!")
            return url
        else:
            print("❌ Formato inválido")
            print("   Debe empezar con https:// o http://")
            print("   Ejemplo: https://inmova.betteruptime.com")
            
            retry = input("\n¿Intentar de nuevo? (s/n): ").lower()
            if retry != 's':
                print("⏭️  Saltando Status Page...")
                return None

def configurar_servidor(sentry_dsn, crisp_id, status_url):
    """Configura las credenciales en el servidor"""
    print_box(
        "CONFIGURANDO SERVIDOR",
        "Conectando a 157.180.119.236..."
    )
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        print("✅ Conexión SSH establecida\n")
        
        # Actualizar cada variable
        vars_configuradas = 0
        
        if sentry_dsn:
            print("🔧 Configurando Sentry DSN...")
            cmd = f'''cd {APP_DIR} && sed -i 's|^NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN="{sentry_dsn}"|' .env.production'''
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.channel.recv_exit_status()
            print("   ✅ Sentry DSN configurada")
            vars_configuradas += 1
        
        if crisp_id:
            print("🔧 Configurando Crisp Website ID...")
            cmd = f'''cd {APP_DIR} && sed -i 's|^NEXT_PUBLIC_CRISP_WEBSITE_ID=.*|NEXT_PUBLIC_CRISP_WEBSITE_ID="{crisp_id}"|' .env.production'''
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.channel.recv_exit_status()
            print("   ✅ Crisp Website ID configurada")
            vars_configuradas += 1
        
        if status_url:
            print("🔧 Configurando Status Page URL...")
            cmd = f'''cd {APP_DIR} && sed -i 's|^NEXT_PUBLIC_STATUS_PAGE_URL=.*|NEXT_PUBLIC_STATUS_PAGE_URL="{status_url}"|' .env.production'''
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.channel.recv_exit_status()
            print("   ✅ Status Page URL configurada")
            vars_configuradas += 1
        
        print(f"\n✅ Variables configuradas: {vars_configuradas}/3")
        
        # Reiniciar PM2
        print("\n🔄 Reiniciando aplicación...")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && pm2 restart inmova-app")
        stdout.channel.recv_exit_status()
        print("   ✅ PM2 reiniciado")
        
        # Esperar
        print("\n⏳ Esperando 10 segundos para que la app arranque...")
        time.sleep(10)
        
        # Health check
        print("\n🧪 Verificando health check...")
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
        output = stdout.read().decode('utf-8', errors='ignore')
        
        if 'ok' in output.lower():
            print("   ✅ Health check OK")
        else:
            print("   ⚠️  Health check no respondió correctamente")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False
        
    finally:
        client.close()
        print("\n🔌 Conexión SSH cerrada")

def main():
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║      🛡️  CONFIGURACIÓN COMPLETA DE LA TRIADA (15 MIN)           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Este script te guiará para:
  1️⃣  Obtener Sentry DSN (Error Tracking)
  2️⃣  Obtener Crisp Website ID (Chat Soporte)
  3️⃣  Obtener BetterStack Status Page (Transparencia)
  4️⃣  Configurar todo en el servidor automáticamente
  5️⃣  Reiniciar la aplicación
  6️⃣  Verificar que funciona

⏱️  Duración: 15 minutos
💰 Costo: $0 (planes gratuitos)
""")
    
    input("¿Comenzar? (presiona Enter)")
    
    # Paso 1: Sentry
    sentry_dsn = obtener_sentry_dsn()
    
    # Paso 2: Crisp
    crisp_id = obtener_crisp_id()
    
    # Paso 3: BetterStack
    status_url = obtener_status_page_url()
    
    # Resumen
    print_box(
        "RESUMEN DE CONFIGURACIÓN",
        f"""
🔴 Sentry DSN: {'✅ Configurada' if sentry_dsn else '⏭️  Saltada'}
💬 Crisp Website ID: {'✅ Configurada' if crisp_id else '⏭️  Saltada'}
📊 Status Page URL: {'✅ Configurada' if status_url else '⏭️  Saltada'}
"""
    )
    
    if not any([sentry_dsn, crisp_id, status_url]):
        print("\n⚠️  No configuraste ninguna credencial")
        print("Puedes ejecutar este script de nuevo cuando las tengas")
        return
    
    confirmar = input("\n¿Configurar estas credenciales en el servidor? (s/n): ").lower()
    if confirmar != 's':
        print("\n❌ Configuración cancelada")
        return
    
    # Configurar en servidor
    success = configurar_servidor(sentry_dsn, crisp_id, status_url)
    
    if success:
        print_box(
            "✅ CONFIGURACIÓN COMPLETADA",
            """
🎉 ¡Tu app ahora está blindada para producción!

🧪 VERIFICA EN PRODUCCIÓN:

1. Abre: https://inmovaapp.com
"""
        )
        
        if crisp_id:
            print("2. ✅ Busca el widget de Crisp (esquina inferior derecha)")
        
        if status_url:
            print("3. ✅ Footer → Click 'Estado del Sistema'")
        
        if sentry_dsn:
            print("4. ✅ Navega a /test-error → Ve a https://sentry.io/issues/")
        
        print("""
📚 DOCUMENTACIÓN:
   - Plan de mantenimiento: docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md
   - Guía rápida: GUIA-RAPIDA-TRIADA.md

🎯 SIGUIENTE PASO:
   Monitorea las primeras 48 horas intensivamente
   (cada 2h el día 1, cada 4h el día 2)

😴 Ahora puedes dormir tranquilo sabiendo que:
   🛡️  Sentry captura errores automáticamente
   💬 Crisp permite soporte 24/7
   📊 BetterStack muestra el estado del sistema
""")
    else:
        print("\n❌ Hubo un error durante la configuración")
        print("Revisa los errores arriba y vuelve a intentar")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Configuración cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
