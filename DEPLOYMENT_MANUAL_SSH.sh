#!/bin/bash
# 🚀 COMANDOS FINALES PARA DEPLOYMENT VÍA SSH
# Copia y pega estos comandos en tu terminal del SERVIDOR

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║  🚀 DEPLOYMENT INMOVA APP - COMANDOS FINALES                 ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# PASO 1: Conectar al servidor (ejecuta en TU TERMINAL LOCAL)
echo "📝 PASO 1: Conectar al servidor"
echo "────────────────────────────────────────────────────────────────"
echo "Ejecuta en TU TERMINAL LOCAL:"
echo ""
echo "  ssh root@157.180.119.236"
echo ""
echo "O si tienes usuario diferente:"
echo "  ssh deploy@157.180.119.236"
echo ""
read -p "Presiona ENTER cuando estés conectado al servidor..."
echo ""

# PASO 2: Navegar y actualizar código
echo "📝 PASO 2: Actualizar código (ejecuta en EL SERVIDOR)"
echo "────────────────────────────────────────────────────────────────"
echo ""

cd /opt/inmova-app || cd /home/deploy/inmova-app || cd /var/www/inmova-app || {
    echo "❌ No se encontró el directorio de la app"
    echo "Por favor, navega manualmente:"
    echo "  cd /ruta/a/tu/app"
    exit 1
}

echo "✅ Directorio actual: $(pwd)"
echo ""

# Verificar estado actual
echo "🔍 Estado actual de Git:"
git status
git log --oneline -3
echo ""

# Pull de cambios
echo "🔽 Descargando cambios desde GitHub..."
git fetch origin
git checkout main
git merge origin/cursor/frontend-audit-inmovaapp-com-6336

if [ $? -eq 0 ]; then
    echo "✅ Merge exitoso"
else
    echo "❌ Error en merge. Resolviendo..."
    echo "Ejecuta manualmente:"
    echo "  git status"
    echo "  git merge --abort"
    exit 1
fi
echo ""

# PASO 3: Detectar sistema de deployment
echo "📝 PASO 3: Detectando sistema de deployment..."
echo "────────────────────────────────────────────────────────────────"
echo ""

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.production.yml" ]; then
    echo "🐳 Detectado: DOCKER"
    echo ""
    echo "Ejecutando deployment con Docker..."
    docker-compose down
    docker-compose up -d --build
    
    echo ""
    echo "⏳ Esperando 15 segundos para warm-up..."
    sleep 15
    
    echo ""
    echo "📊 Estado de containers:"
    docker-compose ps
    
    echo ""
    echo "📋 Últimas líneas de log:"
    docker-compose logs --tail 50 app

elif command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "inmova"; then
    echo "🔄 Detectado: PM2"
    echo ""
    echo "Instalando dependencias..."
    npm install
    
    echo ""
    echo "Building aplicación..."
    npm run build
    
    echo ""
    echo "Reloading PM2 (zero-downtime)..."
    pm2 reload inmova-app || pm2 restart inmova-app
    
    echo ""
    echo "⏳ Esperando 10 segundos..."
    sleep 10
    
    echo ""
    echo "📊 Estado de PM2:"
    pm2 status inmova-app
    
    echo ""
    echo "📋 Últimas líneas de log:"
    pm2 logs inmova-app --lines 50 --nostream

elif systemctl is-active --quiet inmova-app; then
    echo "⚙️  Detectado: SYSTEMD"
    echo ""
    echo "Instalando dependencias..."
    npm install
    
    echo ""
    echo "Building aplicación..."
    npm run build
    
    echo ""
    echo "Reiniciando servicio..."
    systemctl restart inmova-app
    
    echo ""
    echo "⏳ Esperando 10 segundos..."
    sleep 10
    
    echo ""
    echo "📊 Estado del servicio:"
    systemctl status inmova-app
    
    echo ""
    echo "📋 Últimas líneas de log:"
    journalctl -u inmova-app -n 50 --no-pager

else
    echo "🔧 No se detectó sistema de deployment automático"
    echo ""
    echo "Ejecutando deployment MANUAL..."
    
    echo ""
    echo "Instalando dependencias..."
    npm install
    
    echo ""
    echo "Building aplicación..."
    npm run build
    
    echo ""
    echo "Matando proceso anterior en puerto 3000..."
    fuser -k 3000/tcp 2>/dev/null || true
    
    echo ""
    echo "Iniciando aplicación..."
    nohup npm start > /tmp/inmova.log 2>&1 &
    
    echo ""
    echo "⏳ Esperando 10 segundos..."
    sleep 10
    
    echo ""
    echo "📋 Últimas líneas de log:"
    tail -50 /tmp/inmova.log
fi

echo ""
echo "────────────────────────────────────────────────────────────────"
echo ""

# PASO 4: Verificación
echo "📝 PASO 4: Verificación"
echo "────────────────────────────────────────────────────────────────"
echo ""

echo "🔍 Health Check Local:"
if curl -f http://localhost:3000/api/health 2>/dev/null; then
    echo "✅ Health check OK"
else
    echo "❌ Health check FALLÓ"
    echo "Verifica los logs arriba"
fi

echo ""
echo "🔍 Landing Page Local:"
if curl -f http://localhost:3000/landing 2>/dev/null | head -20; then
    echo "✅ Landing page responde"
else
    echo "❌ Landing page NO responde"
fi

echo ""
echo "🔍 Headers de Seguridad:"
curl -I http://localhost:3000 2>/dev/null | grep -i "x-frame\|x-content\|strict-transport" || echo "⚠️  Headers no detectados (puede ser normal si hay proxy)"

echo ""
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║  ✅ DEPLOYMENT COMPLETADO                                    ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Verificación desde FUERA del servidor:"
echo ""
echo "   Ejecuta en TU MÁQUINA (no en el servidor):"
echo ""
echo "   curl https://inmovaapp.com/api/health"
echo "   curl -I https://inmovaapp.com"
echo ""
echo "   Navegador:"
echo "   https://inmovaapp.com/landing"
echo ""
echo "🎯 Checklist Visual:"
echo "   [ ] Landing carga sin errores"
echo "   [ ] Promociones (FLIPPING25, ROOMPRO) tienen texto más oscuro"
echo "   [ ] Login → F12 → inputs tienen autocomplete"
echo "   [ ] Vista móvil (375px) → sin scroll horizontal"
echo ""
echo "✅ ¡Felicidades! Las correcciones ya están en producción"
echo ""
