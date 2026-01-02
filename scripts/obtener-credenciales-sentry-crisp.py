#!/usr/bin/env python3
"""
Script para ayudar a obtener credenciales de Sentry y Crisp
usando las credenciales proporcionadas.

Este script abre los navegadores en las páginas correctas
y guía al usuario para copiar los valores necesarios.
"""

import sys
import webbrowser
import time

# Colores para terminal
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_color(color, text):
    print(f"{color}{text}{RESET}")

def print_banner():
    print_color(CYAN, """
╔══════════════════════════════════════════════════════════════════╗
║     🔑 OBTENER CREDENCIALES - SENTRY & CRISP                    ║
╚══════════════════════════════════════════════════════════════════╝
""")

def open_sentry():
    print_color(CYAN, "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print_color(CYAN, "  1️⃣  SENTRY (Error Tracking)")
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print("📧 Email: dvillagrab@hotmail.com")
    print("🔒 Password: Pucela000000#\n")
    
    print_color(YELLOW, "Abriendo Sentry en el navegador...")
    time.sleep(1)
    
    # Abrir login de Sentry
    webbrowser.open("https://sentry.io/auth/login/")
    
    print("\n📋 INSTRUCCIONES:")
    print("   1. Inicia sesión con las credenciales de arriba")
    print("   2. Si no tienes proyecto, crea uno:")
    print("      - Click 'Create Project'")
    print("      - Plataforma: 'Next.js'")
    print("      - Nombre: 'inmova-production'")
    print("   3. Ve a: Settings → Projects → Tu proyecto → Client Keys (DSN)")
    print("   4. Copia el DSN (formato: https://[hash]@[org].ingest.sentry.io/[id])")
    
    print_color(GREEN, "\n✋ Presiona Enter cuando hayas iniciado sesión...\n")
    input()
    
    # Abrir página de configuración (puede que necesite ajustar org/project)
    print_color(YELLOW, "Abriendo página de configuración...")
    time.sleep(1)
    webbrowser.open("https://sentry.io/settings/projects/")
    
    print_color(GREEN, "\n📋 Copia el DSN y pégalo aquí:")
    sentry_dsn = input("   SENTRY_DSN: ").strip()
    
    # Validar formato básico
    if not sentry_dsn.startswith("https://") or "ingest.sentry.io" not in sentry_dsn:
        print_color(RED, "\n❌ Formato de DSN inválido. Debe ser:")
        print_color(RED, "   https://[hash]@[org].ingest.sentry.io/[id]")
        print_color(YELLOW, "\nIntenta de nuevo:")
        sentry_dsn = input("   SENTRY_DSN: ").strip()
    
    if sentry_dsn and "ingest.sentry.io" in sentry_dsn:
        print_color(GREEN, "✅ Sentry DSN capturado correctamente!\n")
        return sentry_dsn
    else:
        print_color(RED, "❌ DSN inválido. Abortando.\n")
        return None

def open_crisp():
    print_color(CYAN, "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print_color(CYAN, "  2️⃣  CRISP CHAT (Live Support)")
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print("📧 Email: dvillagrab@hotmail.com")
    print("🔒 Password: Pucela000000#\n")
    
    print_color(YELLOW, "Abriendo Crisp Chat en el navegador...")
    time.sleep(1)
    
    # Abrir login de Crisp
    webbrowser.open("https://app.crisp.chat/login/")
    
    print("\n📋 INSTRUCCIONES:")
    print("   1. Inicia sesión con las credenciales de arriba")
    print("   2. Si no tienes sitio web, crea uno:")
    print("      - Click 'Add Website' o '+'")
    print("      - Nombre: 'Inmova App'")
    print("      - URL: 'https://inmovaapp.com'")
    print("   3. Ve a: Settings (⚙️) → Website Settings → Setup instructions")
    print("   4. Copia el Website ID (formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)")
    
    print_color(GREEN, "\n✋ Presiona Enter cuando hayas iniciado sesión...\n")
    input()
    
    print_color(YELLOW, "Esperando que navegues a Setup instructions...\n")
    
    print_color(GREEN, "📋 Copia el Website ID y pégalo aquí:")
    crisp_id = input("   CRISP_WEBSITE_ID: ").strip()
    
    # Validar formato UUID básico
    if len(crisp_id) == 36 and crisp_id.count('-') == 4:
        print_color(GREEN, "✅ Crisp Website ID capturado correctamente!\n")
        return crisp_id
    else:
        print_color(RED, "\n❌ Formato de Website ID inválido. Debe ser:")
        print_color(RED, "   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        print_color(YELLOW, "\nIntenta de nuevo:")
        crisp_id = input("   CRISP_WEBSITE_ID: ").strip()
    
    if len(crisp_id) == 36:
        print_color(GREEN, "✅ Crisp Website ID capturado correctamente!\n")
        return crisp_id
    else:
        print_color(RED, "❌ Website ID inválido. Abortando.\n")
        return None

def open_betterstack():
    print_color(CYAN, "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print_color(CYAN, "  3️⃣  BETTERSTACK (Status Page) - OPCIONAL")
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print_color(YELLOW, "BetterStack requiere registro separado.")
    print_color(YELLOW, "¿Deseas configurarlo ahora? (puedes hacerlo después)\n")
    
    response = input("Configurar BetterStack Status Page? (s/n): ").strip().lower()
    
    if response != 's':
        print_color(YELLOW, "\n⏭️  Saltando BetterStack por ahora.\n")
        return None
    
    print_color(YELLOW, "\nAbriendo BetterStack en el navegador...")
    time.sleep(1)
    webbrowser.open("https://betterstack.com/uptime")
    
    print("\n📋 INSTRUCCIONES:")
    print("   1. Regístrate con dvillagrab@hotmail.com (o usa Google/GitHub)")
    print("   2. Crea un Status Page:")
    print("      - Nombre: 'Inmova System Status'")
    print("      - Subdomain: 'inmova-status' (o el que prefieras)")
    print("   3. Añade un monitor:")
    print("      - URL: 'https://inmovaapp.com'")
    print("      - Check interval: 60 seconds")
    print("   4. Copia la URL pública de tu Status Page")
    
    print_color(GREEN, "\n✋ Presiona Enter cuando hayas completado el setup...\n")
    input()
    
    print_color(GREEN, "📋 Copia la URL de tu Status Page y pégala aquí:")
    status_url = input("   STATUS_PAGE_URL: ").strip()
    
    if status_url.startswith("https://") and "betteruptime.com" in status_url:
        print_color(GREEN, "✅ Status Page URL capturada correctamente!\n")
        return status_url
    else:
        print_color(YELLOW, "\n⚠️  URL no parece válida, pero continuando...")
        return status_url

def save_credentials(sentry_dsn, crisp_id, status_url):
    print_color(CYAN, "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print_color(CYAN, "  📝 RESUMEN DE CREDENCIALES")
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print_color(GREEN, "✅ SENTRY_DSN:")
    print(f"   {sentry_dsn}\n")
    
    print_color(GREEN, "✅ CRISP_WEBSITE_ID:")
    print(f"   {crisp_id}\n")
    
    if status_url:
        print_color(GREEN, "✅ STATUS_PAGE_URL:")
        print(f"   {status_url}\n")
    else:
        print_color(YELLOW, "⏭️  STATUS_PAGE_URL: (no configurado)\n")
    
    # Guardar en archivo temporal
    with open('/tmp/triada-credentials.env', 'w') as f:
        f.write(f"NEXT_PUBLIC_SENTRY_DSN={sentry_dsn}\n")
        f.write(f"SENTRY_DSN={sentry_dsn}\n")
        f.write(f"NEXT_PUBLIC_CRISP_WEBSITE_ID={crisp_id}\n")
        if status_url:
            f.write(f"NEXT_PUBLIC_STATUS_PAGE_URL={status_url}\n")
    
    print_color(GREEN, "💾 Credenciales guardadas en: /tmp/triada-credentials.env\n")
    
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print_color(CYAN, "  🚀 SIGUIENTE PASO")
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    print("Copia este bloque y pégalo en el chat:\n")
    print_color(YELLOW, "```")
    print(f"SENTRY_DSN={sentry_dsn}")
    print(f"CRISP_ID={crisp_id}")
    if status_url:
        print(f"STATUS_URL={status_url}")
    print_color(YELLOW, "```\n")
    
    print_color(GREEN, "El agente configurará estas credenciales en el servidor automáticamente. 🚀\n")

def main():
    print_banner()
    
    print_color(YELLOW, "Este script te guiará para obtener las credenciales de:")
    print("  • Sentry (Error Tracking)")
    print("  • Crisp Chat (Live Support)")
    print("  • BetterStack (Status Page - opcional)\n")
    
    print_color(YELLOW, "Usando las credenciales:")
    print("  📧 Email: dvillagrab@hotmail.com")
    print("  🔒 Password: Pucela000000#\n")
    
    print_color(GREEN, "✋ Presiona Enter para comenzar...\n")
    input()
    
    # 1. Sentry
    sentry_dsn = open_sentry()
    if not sentry_dsn:
        print_color(RED, "❌ No se pudo obtener Sentry DSN. Abortando.\n")
        sys.exit(1)
    
    # 2. Crisp
    crisp_id = open_crisp()
    if not crisp_id:
        print_color(RED, "❌ No se pudo obtener Crisp Website ID. Abortando.\n")
        sys.exit(1)
    
    # 3. BetterStack (opcional)
    status_url = open_betterstack()
    
    # Guardar y mostrar resumen
    save_credentials(sentry_dsn, crisp_id, status_url)
    
    print_color(GREEN, "✅ ¡Proceso completado exitosamente!\n")
    print_color(CYAN, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_color(YELLOW, "\n\n⚠️  Proceso cancelado por el usuario.\n")
        sys.exit(0)
    except Exception as e:
        print_color(RED, f"\n❌ Error: {e}\n")
        sys.exit(1)
