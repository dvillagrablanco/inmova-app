#!/usr/bin/env python3
"""
Configurar credenciales de la Triada en el servidor de forma interactiva
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import re

# Credenciales del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "xcc9brgkMMbf"
APP_DIR = "/opt/inmova-app"

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
    pattern = r'^https?://.+'
    return re.match(pattern, url) is not None

def solicitar_credencial(nombre, validador, instrucciones):
    """Solicita una credencial al usuario con validación"""
    print(f"\n{'=' * 70}")
    print(f"  {nombre}")
    print(f"{'=' * 70}")
    print(instrucciones)
    
    while True:
        valor = input(f"\nPega tu {nombre} aquí (o Enter para saltar): ").strip()
        
        if not valor:
            print(f"⏭️  Saltando {nombre}...")
            return None
        
        if validador(valor):
            print(f"✅ {nombre} válido")
            return valor
        else:
            print(f"❌ Formato inválido. Inténtalo de nuevo.")
            retry = input("¿Intentar de nuevo? (s/n): ").lower()
            if retry != 's':
                return None

def actualizar_env_servidor(client, variable, valor):
    """Actualiza una variable en .env.production del servidor"""
    if not valor:
        return False
    
    # Escapar caracteres especiales para sed
    valor_escaped = valor.replace('/', '\/')
    
    # Comando sed para reemplazar la línea
    comando = f'''cd {APP_DIR} && sed -i 's|^{variable}=.*|{variable}="{valor}"|' .env.production'''
    
    print(f"\n🔧 Actualizando {variable} en el servidor...")
    
    stdin, stdout, stderr = client.exec_command(comando, timeout=10)
    exit_status = stdout.channel.recv_exit_status()
    
    if exit_status == 0:
        print(f"   ✅ {variable} actualizada")
        return True
    else:
        print(f"   ❌ Error actualizando {variable}")
        print(f"   {stderr.read().decode('utf-8', errors='ignore')}")
        return False

def main():
    print("=" * 70)
    print("  🛡️  CONFIGURACIÓN INTERACTIVA DE LA TRIADA")
    print("=" * 70)
    print("\nEste asistente te guiará para obtener y configurar:")
    print("  1️⃣  Sentry DSN (Error Tracking)")
    print("  2️⃣  Crisp Website ID (Chat de Soporte)")
    print("  3️⃣  BetterStack Status Page URL")
    print("\n⏱️  Duración: ~15 minutos")
    print("💰 Costo: $0 (planes gratuitos)")
    
    input("\n¿Comenzar? (presiona Enter)")
    
    # 1. Sentry DSN
    sentry_dsn = solicitar_credencial(
        "SENTRY DSN",
        validar_sentry_dsn,
        """
🔴 SENTRY - Error Tracking

Pasos:
1. Abre en tu navegador: https://sentry.io/signup/
2. Regístrate con tu email (o GitHub/Google)
3. Selecciona plan "Developer" (gratis, 5,000 errores/mes)
4. Click "Create Project"
5. Plataforma: "Next.js"
6. Nombre del proyecto: "inmova-app"
7. Copia el DSN que aparece
   Formato: https://[key]@[org].ingest.sentry.io/[id]
"""
    )
    
    # 2. Crisp Website ID
    crisp_id = solicitar_credencial(
        "CRISP WEBSITE ID",
        validar_crisp_id,
        """
💬 CRISP - Chat de Soporte

Pasos:
1. Abre en tu navegador: https://crisp.chat/
2. Click "Try Crisp Free"
3. Regístrate con tu email
4. Completa el onboarding (nombre del sitio web, etc.)
5. Ve a Settings (⚙️) → Website Settings
6. Click en "Setup Instructions"
7. Busca "Website ID" y cópialo
   Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID)
"""
    )
    
    # 3. BetterStack Status Page URL
    status_url = solicitar_credencial(
        "BETTERSTACK STATUS PAGE URL",
        validar_url,
        """
📊 BETTERSTACK - Status Page

Pasos:
1. Abre en tu navegador: https://betterstack.com/uptime
2. Click "Start Free"
3. Regístrate con tu email
4. Click "Add Monitor"
   - URL: https://inmovaapp.com/api/health
   - Name: Inmova App
   - Check frequency: 3 minutos
   - Click "Create Monitor"
5. Menú lateral → "Status Pages"
6. Click "Create Status Page"
   - Name: Inmova Status
   - Selecciona el monitor que creaste
   - Click "Create Status Page"
7. Copia la URL pública
   Ejemplo: https://inmova.betteruptime.com
"""
    )
    
    # Resumen de lo que se va a configurar
    print("\n" + "=" * 70)
    print("  📋 RESUMEN DE CONFIGURACIÓN")
    print("=" * 70)
    
    credenciales_configuradas = 0
    
    if sentry_dsn:
        print(f"\n🔴 Sentry DSN:")
        print(f"   {sentry_dsn[:50]}...")
        credenciales_configuradas += 1
    else:
        print(f"\n⏭️  Sentry DSN: Saltado")
    
    if crisp_id:
        print(f"\n💬 Crisp Website ID:")
        print(f"   {crisp_id}")
        credenciales_configuradas += 1
    else:
        print(f"\n⏭️  Crisp Website ID: Saltado")
    
    if status_url:
        print(f"\n📊 Status Page URL:")
        print(f"   {status_url}")
        credenciales_configuradas += 1
    else:
        print(f"\n⏭️  Status Page URL: Saltado")
    
    if credenciales_configuradas == 0:
        print("\n⚠️  No configuraste ninguna credencial.")
        print("   Puedes ejecutar este script de nuevo cuando las tengas.")
        return True
    
    confirmar = input(f"\n¿Aplicar estos cambios en el servidor? (s/n): ").lower()
    if confirmar != 's':
        print("\n❌ Configuración cancelada")
        return False
    
    # Conectar al servidor
    print(f"\n📡 Conectando a {SERVER_IP}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        print("   ✅ Conexión SSH establecida")
        
        # Actualizar variables en el servidor
        if sentry_dsn:
            actualizar_env_servidor(client, "NEXT_PUBLIC_SENTRY_DSN", sentry_dsn)
        
        if crisp_id:
            actualizar_env_servidor(client, "NEXT_PUBLIC_CRISP_WEBSITE_ID", crisp_id)
        
        if status_url:
            actualizar_env_servidor(client, "NEXT_PUBLIC_STATUS_PAGE_URL", status_url)
        
        # Verificar el archivo actualizado
        print("\n🔍 Verificando .env.production actualizado...")
        stdin, stdout, stderr = client.exec_command(
            f"cat {APP_DIR}/.env.production | grep -A 1 'TRIADA DE MANTENIMIENTO'"
        )
        output = stdout.read().decode('utf-8', errors='ignore')
        print(output[:500])
        
        # Reiniciar PM2
        print("\n🔄 Reiniciando aplicación...")
        stdin, stdout, stderr = client.exec_command(
            f"cd {APP_DIR} && pm2 restart inmova-app"
        )
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        print(f"   {output[:200]}")
        
        # Esperar un poco para que arranque
        print("\n⏳ Esperando 10 segundos para que la app arranque...")
        import time
        time.sleep(10)
        
        # Health check
        print("\n🧪 Verificando health check...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s http://localhost:3000/api/health"
        )
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        
        if output:
            print(f"   ✅ Health check OK: {output[:100]}")
        else:
            print(f"   ⚠️  No response from health check")
        
        # Resumen final
        print("\n" + "=" * 70)
        print("  ✅ CONFIGURACIÓN COMPLETADA")
        print("=" * 70)
        
        print(f"\n📝 Variables configuradas: {credenciales_configuradas}/3")
        
        print("\n🧪 VERIFICA EN PRODUCCIÓN:")
        print("   1. Abre: https://inmovaapp.com")
        print("")
        if crisp_id:
            print("   2. Busca el widget de Crisp (esquina inferior derecha)")
        if status_url:
            print("   3. Scroll al Footer → Click en 'Estado del Sistema'")
        if sentry_dsn:
            print("   4. Fuerza un error → Ve a https://sentry.io/issues/")
        
        print("\n📚 DOCUMENTACIÓN:")
        print(f"   {APP_DIR}/docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md")
        print(f"   {APP_DIR}/GUIA-RAPIDA-TRIADA.md")
        
        print("\n🎉 ¡Listo! Tu app ahora está blindada para producción.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        client.close()
        print("\n🔌 Conexión SSH cerrada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
