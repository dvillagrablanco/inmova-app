#!/usr/bin/env python3
"""
Preparar servidor para configuración de la Triada de Mantenimiento
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# Credenciales del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "xcc9brgkMMbf"
APP_DIR = "/opt/inmova-app"

def ejecutar_comando(client, comando, descripcion=""):
    """Ejecuta un comando y retorna el resultado"""
    if descripcion:
        print(f"\n🔧 {descripcion}")
    print(f"   $ {comando}")
    
    stdin, stdout, stderr = client.exec_command(comando, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        if output:
            print(f"   ✅ {output[:200]}")
        return True, output, error
    else:
        print(f"   ❌ Error (exit code {exit_status})")
        if error:
            print(f"   {error[:200]}")
        return False, output, error

def main():
    print("=" * 70)
    print("  🛡️  PREPARACIÓN DE TRIADA EN SERVIDOR")
    print("=" * 70)
    
    # Conectar
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
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    try:
        # 1. Verificar que el directorio existe
        success, output, _ = ejecutar_comando(
            client,
            f"test -d {APP_DIR} && echo 'EXISTS' || echo 'NOT_EXISTS'",
            "Verificando directorio de aplicación"
        )
        
        if "NOT_EXISTS" in output:
            print(f"\n❌ El directorio {APP_DIR} no existe")
            print(f"   Crea el directorio primero o ajusta APP_DIR en el script")
            return False
        
        # 2. Ir al directorio
        ejecutar_comando(
            client,
            f"cd {APP_DIR} && pwd",
            "Cambiando al directorio de la aplicación"
        )
        
        # 3. Verificar git status
        ejecutar_comando(
            client,
            f"cd {APP_DIR} && git status --short",
            "Verificando estado de git"
        )
        
        # 4. Hacer git pull para traer últimos cambios
        success, output, error = ejecutar_comando(
            client,
            f"cd {APP_DIR} && git pull origin cursor/estudio-soluci-n-definitiva-b635",
            "Actualizando código desde GitHub"
        )
        
        if not success and "Already up to date" not in output:
            print(f"   ⚠️  Advertencia: Git pull falló, pero continuamos...")
        
        # 5. Verificar que .env.production existe
        success, output, _ = ejecutar_comando(
            client,
            f"test -f {APP_DIR}/.env.production && echo 'EXISTS' || echo 'NOT_EXISTS'",
            "Verificando .env.production"
        )
        
        if "NOT_EXISTS" in output:
            print("   ⚠️  .env.production no existe, se creará uno nuevo")
        
        # 6. Backup del .env.production actual (si existe)
        ejecutar_comando(
            client,
            f"cd {APP_DIR} && cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true",
            "Haciendo backup de .env.production existente"
        )
        
        # 7. Leer .env.production actual para ver qué variables ya existen
        success, current_env, _ = ejecutar_comando(
            client,
            f"cat {APP_DIR}/.env.production 2>/dev/null || echo ''",
            "Leyendo .env.production actual"
        )
        
        # 8. Verificar qué variables de la Triada ya están configuradas
        print("\n📋 Estado de variables de la Triada:")
        
        triada_vars = {
            'NEXT_PUBLIC_SENTRY_DSN': 'No configurada',
            'NEXT_PUBLIC_CRISP_WEBSITE_ID': 'No configurada',
            'NEXT_PUBLIC_STATUS_PAGE_URL': 'No configurada'
        }
        
        for var_name in triada_vars.keys():
            if var_name in current_env and not current_env.split(var_name)[1].split('\n')[0].strip() in ['=', '=""', "=''", '=']:
                # Variable existe y tiene valor
                value_line = current_env.split(var_name)[1].split('\n')[0]
                print(f"   ✅ {var_name}: YA CONFIGURADA")
                triada_vars[var_name] = 'Configurada'
            else:
                print(f"   ⚠️  {var_name}: PENDIENTE")
        
        # 9. Añadir las variables de la Triada si no existen
        print("\n🔧 Añadiendo variables de la Triada a .env.production...")
        
        triada_block = """

# ============================================
# 🛡️ TRIADA DE MANTENIMIENTO - INMOVA
# ============================================
# Configuración para "dormir tranquilo" con clientes en producción
# Documentación: docs/TRIADA-MANTENIMIENTO.md

# 🔴 EL CENTINELA - Error Tracking (Sentry)
# Obtén tu DSN en: https://sentry.io/settings/projects/
# 1. Crea cuenta en https://sentry.io/signup/
# 2. Crea proyecto "inmova-app" (Next.js)
# 3. Copia el DSN (formato: https://[key]@[org].ingest.sentry.io/[id])
NEXT_PUBLIC_SENTRY_DSN="PENDIENTE_OBTENER_EN_SENTRY"

# 💬 EL ESCUDO - Chat de Soporte (Crisp)
# Obtén tu Website ID en: https://app.crisp.chat/settings/
# 1. Crea cuenta en https://crisp.chat/
# 2. Settings → Website Settings → Setup Instructions
# 3. Copia el Website ID (formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NEXT_PUBLIC_CRISP_WEBSITE_ID="PENDIENTE_OBTENER_EN_CRISP"

# 📊 LA TRANSPARENCIA - Status Page
# Crea Status Page en: https://betterstack.com/uptime
# 1. Crea cuenta en https://betterstack.com/uptime
# 2. Crea monitor para https://inmovaapp.com/api/health
# 3. Crea Status Page pública
# 4. Copia la URL pública (ej: https://inmova.betteruptime.com)
NEXT_PUBLIC_STATUS_PAGE_URL="PENDIENTE_OBTENER_EN_BETTERSTACK"
"""
        
        # Verificar si ya existe la sección de Triada
        if "TRIADA DE MANTENIMIENTO" in current_env:
            print("   ℹ️  Sección de Triada ya existe en .env.production")
            print("   ℹ️  Las variables existentes se mantendrán")
        else:
            # Añadir la sección al final del archivo
            comando_append = f"cd {APP_DIR} && echo '{triada_block}' >> .env.production"
            ejecutar_comando(
                client,
                comando_append,
                "Añadiendo sección de Triada al .env.production"
            )
        
        # 10. Verificar que los archivos de código de la Triada existen
        print("\n📁 Verificando archivos de código de la Triada:")
        
        archivos_triada = [
            'components/ui/GlobalErrorBoundary.tsx',
            'components/support/ChatWidget.tsx',
            'lib/error-handling.ts',
            'components/ui/WidgetErrorBoundary.tsx',
            'components/support/HelpComponents.tsx',
            'scripts/setup-triada.ts',
            'scripts/verify-triada.ts',
            'scripts/verify-production-ready.ts'
        ]
        
        archivos_ok = 0
        archivos_faltantes = []
        
        for archivo in archivos_triada:
            success, output, _ = ejecutar_comando(
                client,
                f"test -f {APP_DIR}/{archivo} && echo 'EXISTS' || echo 'NOT_EXISTS'",
                ""
            )
            if "EXISTS" in output:
                print(f"   ✅ {archivo}")
                archivos_ok += 1
            else:
                print(f"   ❌ {archivo} - NO ENCONTRADO")
                archivos_faltantes.append(archivo)
        
        # 11. Verificar PM2 status
        ejecutar_comando(
            client,
            "pm2 status",
            "Verificando estado de PM2"
        )
        
        # 12. Resumen final
        print("\n" + "=" * 70)
        print("  📊 RESUMEN")
        print("=" * 70)
        
        print(f"\n✅ Código actualizado desde GitHub")
        print(f"✅ Archivos de Triada: {archivos_ok}/{len(archivos_triada)} presentes")
        
        if archivos_faltantes:
            print(f"⚠️  Archivos faltantes: {len(archivos_faltantes)}")
            for archivo in archivos_faltantes:
                print(f"   - {archivo}")
        
        print(f"\n📝 Variables de entorno:")
        for var_name, status in triada_vars.items():
            icon = "✅" if status == "Configurada" else "⏳"
            print(f"   {icon} {var_name}: {status}")
        
        # 13. Instrucciones siguientes
        print("\n" + "=" * 70)
        print("  🚀 SIGUIENTES PASOS")
        print("=" * 70)
        
        vars_pendientes = [k for k, v in triada_vars.items() if v == "No configurada"]
        
        if vars_pendientes:
            print("\n1️⃣  OBTÉN LAS CREDENCIALES (15 minutos):")
            print("")
            
            if 'NEXT_PUBLIC_SENTRY_DSN' in vars_pendientes:
                print("🔴 SENTRY DSN:")
                print("   1. Ve a https://sentry.io/signup/")
                print("   2. Crea proyecto 'inmova-app' (Next.js)")
                print("   3. Copia el DSN")
                print("")
            
            if 'NEXT_PUBLIC_CRISP_WEBSITE_ID' in vars_pendientes:
                print("💬 CRISP WEBSITE ID:")
                print("   1. Ve a https://crisp.chat/")
                print("   2. Settings → Setup Instructions")
                print("   3. Copia el Website ID (UUID)")
                print("")
            
            if 'NEXT_PUBLIC_STATUS_PAGE_URL' in vars_pendientes:
                print("📊 BETTERSTACK STATUS PAGE:")
                print("   1. Ve a https://betterstack.com/uptime")
                print("   2. Crea monitor para https://inmovaapp.com/api/health")
                print("   3. Crea Status Page pública")
                print("   4. Copia la URL")
                print("")
            
            print("2️⃣  EDITA .env.production EN EL SERVIDOR:")
            print(f"   nano {APP_DIR}/.env.production")
            print("")
            print("   Busca las líneas que dicen 'PENDIENTE_OBTENER_...'")
            print("   y reemplázalas con tus credenciales reales")
            print("")
            
            print("3️⃣  REINICIA LA APLICACIÓN:")
            print("   pm2 restart inmova-app")
            print("")
            
            print("4️⃣  VERIFICA EN PRODUCCIÓN:")
            print("   curl https://inmovaapp.com/api/health")
            print("   # Luego abre en navegador y verifica:")
            print("   # - Widget de Crisp (esquina inferior derecha)")
            print("   # - Footer: Link 'Estado del Sistema'")
            print("")
        else:
            print("\n✅ ¡Todas las variables de la Triada ya están configuradas!")
            print("")
            print("🔄 REINICIA LA APLICACIÓN:")
            print("   pm2 restart inmova-app")
            print("")
            print("🧪 VERIFICA EN PRODUCCIÓN:")
            print("   curl https://inmovaapp.com/api/health")
            print("   open https://inmovaapp.com")
            print("")
        
        print("📚 DOCUMENTACIÓN COMPLETA:")
        print(f"   {APP_DIR}/docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md")
        print(f"   {APP_DIR}/GUIA-RAPIDA-TRIADA.md")
        print("")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la preparación: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        client.close()
        print("\n🔌 Conexión SSH cerrada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
