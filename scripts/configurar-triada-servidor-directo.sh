#!/bin/bash
###############################################################################
# CONFIGURACIÓN DE LA TRIADA - SCRIPT DIRECTO EN SERVIDOR
# Ejecuta este script EN EL SERVIDOR para configurar todo
###############################################################################

APP_DIR="/opt/inmova-app"
ENV_FILE="$APP_DIR/.env.production"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Banner
clear
print_color "$CYAN" "╔══════════════════════════════════════════════════════════════════╗"
print_color "$CYAN" "║                                                                  ║"
print_color "$CYAN" "║      🛡️  CONFIGURACIÓN DE LA TRIADA - SERVIDOR                  ║"
print_color "$CYAN" "║                                                                  ║"
print_color "$CYAN" "╔══════════════════════════════════════════════════════════════════╝"
echo ""
print_color "$YELLOW" "Este script configurará las 3 variables de la Triada:"
echo "  1️⃣  Sentry DSN (Error Tracking)"
echo "  2️⃣  Crisp Website ID (Chat Soporte)"
echo "  3️⃣  BetterStack Status Page (Transparencia)"
echo ""
print_color "$YELLOW" "⏱️  Duración: 15 minutos"
print_color "$GREEN" "💰 Costo: \$0 (planes gratuitos)"
echo ""

read -p "¿Comenzar? (s/n): " start
if [ "$start" != "s" ]; then
    print_color "$RED" "Configuración cancelada"
    exit 1
fi

###############################################################################
# PASO 1: SENTRY DSN
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
print_color "$CYAN" "  PASO 1/3: SENTRY DSN (Error Tracking)"
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
echo ""
print_color "$BLUE" "🔴 Sentry captura automáticamente TODOS los errores de tu app"
echo ""
print_color "$YELLOW" "Pasos para obtener el DSN:"
echo "  1. Abre en tu navegador: https://sentry.io/signup/"
echo "  2. Regístrate con email o GitHub/Google"
echo "  3. Plan 'Developer' (GRATIS, 5,000 errores/mes)"
echo "  4. Click 'Create Project'"
echo "  5. Plataforma: 'Next.js'"
echo "  6. Nombre: 'inmova-app'"
echo "  7. COPIA EL DSN que aparece"
echo ""
print_color "$YELLOW" "  Formato: https://[key]@[org].ingest.sentry.io/[id]"
print_color "$YELLOW" "  Ejemplo: https://abc123@sentry.ingest.io/12345"
echo ""

while true; do
    read -p "📋 Pega tu Sentry DSN aquí (o Enter para saltar): " SENTRY_DSN
    
    if [ -z "$SENTRY_DSN" ]; then
        print_color "$YELLOW" "⏭️  Saltando Sentry..."
        SENTRY_DSN=""
        break
    fi
    
    # Validar formato
    if [[ $SENTRY_DSN =~ ^https://[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io/[0-9]+$ ]]; then
        print_color "$GREEN" "✅ Sentry DSN válido!"
        break
    else
        print_color "$RED" "❌ Formato inválido"
        print_color "$YELLOW" "   Debe tener formato: https://[key]@[org].ingest.sentry.io/[id]"
        read -p "¿Intentar de nuevo? (s/n): " retry
        if [ "$retry" != "s" ]; then
            SENTRY_DSN=""
            break
        fi
    fi
done

###############################################################################
# PASO 2: CRISP WEBSITE ID
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
print_color "$CYAN" "  PASO 2/3: CRISP WEBSITE ID (Chat de Soporte)"
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
echo ""
print_color "$BLUE" "💬 Crisp permite soporte 24/7 a tus usuarios"
echo ""
print_color "$YELLOW" "Pasos para obtener el Website ID:"
echo "  1. Abre en tu navegador: https://crisp.chat/"
echo "  2. Click 'Try Crisp Free'"
echo "  3. Regístrate con email"
echo "  4. Completa el onboarding (nombre del sitio, URL)"
echo "  5. Ve a Settings (⚙️) → Website Settings"
echo "  6. Click 'Setup Instructions'"
echo "  7. COPIA EL WEBSITE ID"
echo ""
print_color "$YELLOW" "  Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID)"
print_color "$YELLOW" "  Ejemplo: 12345678-1234-1234-1234-123456789abc"
echo ""

while true; do
    read -p "📋 Pega tu Crisp Website ID aquí (o Enter para saltar): " CRISP_ID
    
    if [ -z "$CRISP_ID" ]; then
        print_color "$YELLOW" "⏭️  Saltando Crisp..."
        CRISP_ID=""
        break
    fi
    
    # Validar formato UUID
    if [[ $CRISP_ID =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
        print_color "$GREEN" "✅ Crisp Website ID válido!"
        break
    else
        print_color "$RED" "❌ Formato inválido"
        print_color "$YELLOW" "   Debe ser un UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        read -p "¿Intentar de nuevo? (s/n): " retry
        if [ "$retry" != "s" ]; then
            CRISP_ID=""
            break
        fi
    fi
done

###############################################################################
# PASO 3: BETTERSTACK STATUS PAGE
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
print_color "$CYAN" "  PASO 3/3: BETTERSTACK STATUS PAGE (Transparencia)"
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
echo ""
print_color "$BLUE" "📊 Status Page muestra si tu app está operativa"
echo ""
print_color "$YELLOW" "Pasos para crear la Status Page:"
echo "  1. Abre en tu navegador: https://betterstack.com/uptime"
echo "  2. Click 'Start Free'"
echo "  3. Regístrate con email"
echo "  4. Click 'Add Monitor':"
echo "     - URL: https://inmovaapp.com/api/health"
echo "     - Name: Inmova App"
echo "     - Check frequency: 3 minutos"
echo "     - Click 'Create Monitor'"
echo "  5. Menú lateral → 'Status Pages'"
echo "  6. Click 'Create Status Page':"
echo "     - Name: Inmova Status"
echo "     - Selecciona el monitor"
echo "     - Subdomain: inmova (o el que prefieras)"
echo "     - Click 'Create Status Page'"
echo "  7. COPIA LA URL PÚBLICA"
echo ""
print_color "$YELLOW" "  Ejemplo: https://inmova.betteruptime.com"
echo ""

while true; do
    read -p "📋 Pega la URL de tu Status Page aquí (o Enter para saltar): " STATUS_URL
    
    if [ -z "$STATUS_URL" ]; then
        print_color "$YELLOW" "⏭️  Saltando Status Page..."
        print_color "$YELLOW" "   (Puedes configurarlo después)"
        STATUS_URL=""
        break
    fi
    
    # Validar que empiece con http
    if [[ $STATUS_URL =~ ^https?:// ]]; then
        print_color "$GREEN" "✅ Status Page URL válida!"
        break
    else
        print_color "$RED" "❌ Formato inválido"
        print_color "$YELLOW" "   Debe empezar con https:// o http://"
        read -p "¿Intentar de nuevo? (s/n): " retry
        if [ "$retry" != "s" ]; then
            STATUS_URL=""
            break
        fi
    fi
done

###############################################################################
# RESUMEN Y CONFIRMACIÓN
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
print_color "$CYAN" "  RESUMEN DE CONFIGURACIÓN"
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
echo ""

VARS_CONFIGURADAS=0

if [ -n "$SENTRY_DSN" ]; then
    print_color "$GREEN" "🔴 Sentry DSN: ✅ Configurada"
    echo "   ${SENTRY_DSN:0:50}..."
    VARS_CONFIGURADAS=$((VARS_CONFIGURADAS + 1))
else
    print_color "$YELLOW" "🔴 Sentry DSN: ⏭️  Saltada"
fi

if [ -n "$CRISP_ID" ]; then
    print_color "$GREEN" "💬 Crisp Website ID: ✅ Configurada"
    echo "   $CRISP_ID"
    VARS_CONFIGURADAS=$((VARS_CONFIGURADAS + 1))
else
    print_color "$YELLOW" "💬 Crisp Website ID: ⏭️  Saltada"
fi

if [ -n "$STATUS_URL" ]; then
    print_color "$GREEN" "📊 Status Page URL: ✅ Configurada"
    echo "   $STATUS_URL"
    VARS_CONFIGURADAS=$((VARS_CONFIGURADAS + 1))
else
    print_color "$YELLOW" "📊 Status Page URL: ⏭️  Saltada"
fi

echo ""

if [ $VARS_CONFIGURADAS -eq 0 ]; then
    print_color "$YELLOW" "⚠️  No configuraste ninguna credencial"
    print_color "$YELLOW" "Puedes ejecutar este script de nuevo cuando las tengas"
    exit 0
fi

read -p "¿Aplicar estos cambios en .env.production? (s/n): " confirm
if [ "$confirm" != "s" ]; then
    print_color "$RED" "❌ Configuración cancelada"
    exit 1
fi

###############################################################################
# APLICAR CONFIGURACIÓN
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
print_color "$CYAN" "  APLICANDO CONFIGURACIÓN"
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
echo ""

# Verificar que el archivo existe
if [ ! -f "$ENV_FILE" ]; then
    print_color "$RED" "❌ Error: $ENV_FILE no existe"
    exit 1
fi

# Backup
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
print_color "$GREEN" "✅ Backup creado: $BACKUP_FILE"
echo ""

# Actualizar variables
if [ -n "$SENTRY_DSN" ]; then
    print_color "$BLUE" "🔧 Configurando Sentry DSN..."
    sed -i "s|^NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN=\"$SENTRY_DSN\"|" "$ENV_FILE"
    print_color "$GREEN" "   ✅ Sentry DSN configurada"
fi

if [ -n "$CRISP_ID" ]; then
    print_color "$BLUE" "🔧 Configurando Crisp Website ID..."
    sed -i "s|^NEXT_PUBLIC_CRISP_WEBSITE_ID=.*|NEXT_PUBLIC_CRISP_WEBSITE_ID=\"$CRISP_ID\"|" "$ENV_FILE"
    print_color "$GREEN" "   ✅ Crisp Website ID configurada"
fi

if [ -n "$STATUS_URL" ]; then
    print_color "$BLUE" "🔧 Configurando Status Page URL..."
    sed -i "s|^NEXT_PUBLIC_STATUS_PAGE_URL=.*|NEXT_PUBLIC_STATUS_PAGE_URL=\"$STATUS_URL\"|" "$ENV_FILE"
    print_color "$GREEN" "   ✅ Status Page URL configurada"
fi

echo ""
print_color "$GREEN" "✅ Variables configuradas: $VARS_CONFIGURADAS/3"

###############################################################################
# REINICIAR PM2
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
print_color "$CYAN" "  REINICIANDO APLICACIÓN"
print_color "$CYAN" "═══════════════════════════════════════════════════════════════════"
echo ""

print_color "$BLUE" "🔄 Reiniciando PM2..."
cd "$APP_DIR"
pm2 restart inmova-app

if [ $? -eq 0 ]; then
    print_color "$GREEN" "   ✅ PM2 reiniciado exitosamente"
else
    print_color "$RED" "   ❌ Error al reiniciar PM2"
    exit 1
fi

# Esperar
print_color "$YELLOW" ""
print_color "$YELLOW" "⏳ Esperando 10 segundos para que la app arranque..."
sleep 10

# Health check
print_color "$BLUE" ""
print_color "$BLUE" "🧪 Verificando health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    print_color "$GREEN" "   ✅ Health check OK"
    echo "   $HEALTH_RESPONSE"
else
    print_color "$YELLOW" "   ⚠️  Health check no respondió correctamente"
    echo "   Respuesta: $HEALTH_RESPONSE"
fi

###############################################################################
# FINALIZACIÓN
###############################################################################

print_color "$CYAN" ""
print_color "$CYAN" "╔══════════════════════════════════════════════════════════════════╗"
print_color "$CYAN" "║                                                                  ║"
print_color "$CYAN" "║      ✅ CONFIGURACIÓN COMPLETADA                                 ║"
print_color "$CYAN" "║                                                                  ║"
print_color "$CYAN" "╚══════════════════════════════════════════════════════════════════╝"
echo ""
print_color "$GREEN" "🎉 ¡Tu app ahora está blindada para producción!"
echo ""
print_color "$YELLOW" "🧪 VERIFICA EN PRODUCCIÓN:"
echo ""
echo "1. Abre: https://inmovaapp.com"
echo ""

if [ -n "$CRISP_ID" ]; then
    echo "2. ✅ Busca el widget de Crisp (esquina inferior derecha)"
fi

if [ -n "$STATUS_URL" ]; then
    echo "3. ✅ Footer → Click 'Estado del Sistema'"
fi

if [ -n "$SENTRY_DSN" ]; then
    echo "4. ✅ Navega a /test-error → Ve a https://sentry.io/issues/"
fi

echo ""
print_color "$YELLOW" "📚 DOCUMENTACIÓN:"
echo "   - $APP_DIR/docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md"
echo "   - $APP_DIR/GUIA-RAPIDA-TRIADA.md"
echo ""
print_color "$GREEN" "😴 Ahora puedes dormir tranquilo sabiendo que:"
echo "   🛡️  Sentry captura errores automáticamente"
echo "   💬 Crisp permite soporte 24/7"
echo "   📊 BetterStack muestra el estado del sistema"
echo ""
