#!/bin/bash
# 🚀 Script de Deployment Automatizado - Inmova App
# Fecha: 30 de Diciembre de 2025
# Branch: cursor/frontend-audit-inmovaapp-com-6336

set -e  # Exit on error

echo "🚀 =========================================="
echo "   DEPLOYMENT - INMOVA APP"
echo "   Correcciones Frontend Audit"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para logs
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Paso 1: Verificar que estamos en el directorio correcto
echo "📂 Verificando directorio..."
if [ ! -f "package.json" ]; then
    log_error "No se encuentra package.json. ¿Estás en el directorio correcto?"
    exit 1
fi
log_success "Directorio correcto"

# Paso 2: Verificar estado de Git
echo ""
echo "🔍 Verificando estado de Git..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Hay cambios sin commitear"
    echo ""
    git status --short
    echo ""
    read -p "¿Continuar de todos modos? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelado por el usuario"
        exit 1
    fi
else
    log_success "Working directory limpio"
fi

# Paso 3: Mostrar archivos modificados
echo ""
echo "📝 Archivos que se deployarán:"
echo "   - components/landing/sections/PromoBanner.tsx"
echo "   - next.config.js"
echo "   - components/forms/AccessibleFormField.tsx"
echo "   - app/globals.css"
echo "   - public/og-image-template.svg"
echo ""

# Paso 4: Preguntar tipo de deployment
echo "🎯 Selecciona método de deployment:"
echo "   1) Vercel (git push → auto-deploy)"
echo "   2) Docker en Servidor Propio (SSH)"
echo "   3) PM2 en Servidor (SSH)"
echo "   4) Solo Commit (sin deploy)"
echo ""
read -p "Opción (1-4): " deploy_option

case $deploy_option in
    1)
        echo ""
        echo "🚀 DEPLOYMENT VERCEL"
        echo "===================="
        
        # Commit si hay cambios
        if [ -n "$(git status --porcelain)" ]; then
            echo ""
            echo "📝 Commiteando cambios..."
            git add components/landing/sections/PromoBanner.tsx \
                    next.config.js \
                    components/forms/AccessibleFormField.tsx \
                    app/globals.css \
                    public/og-image-template.svg
            
            git commit -m "fix: frontend audit corrections - WCAG AA, security headers, responsive mobile

- Mejorado contraste de colores (WCAG 2.1 AA)
- Añadidos headers de seguridad HTTP (CSP, X-Frame-Options, HSTS)
- Implementado autocomplete en formularios
- Corregido overflow horizontal en móvil
- Aumentados touch targets a 48x48px mínimo
- Creada imagen Open Graph (1200x630px)

Fixes 13 critical frontend issues detected in Playwright audit."
            
            log_success "Commit creado"
        fi
        
        echo ""
        echo "🔼 Pusheando a GitHub..."
        BRANCH=$(git branch --show-current)
        git push origin $BRANCH
        log_success "Push exitoso a branch: $BRANCH"
        
        echo ""
        log_warning "Si estás en un branch (no main), crea un Pull Request en GitHub"
        log_warning "Vercel deployará automáticamente cuando hagas merge a main"
        echo ""
        echo "🔗 O usa Vercel CLI para deploy directo:"
        echo "   vercel --prod"
        ;;
        
    2)
        echo ""
        echo "🐳 DEPLOYMENT DOCKER"
        echo "==================="
        read -p "IP del servidor: " server_ip
        read -p "Usuario SSH: " ssh_user
        read -p "Path de la app: " app_path
        
        echo ""
        echo "📤 Conectando a $ssh_user@$server_ip..."
        
        ssh $ssh_user@$server_ip << EOF
            set -e
            echo "📂 Navegando a $app_path"
            cd $app_path
            
            echo "🔽 Pulling latest code..."
            git pull origin main
            
            echo "🐳 Rebuilding Docker containers..."
            docker-compose down
            docker-compose up -d --build
            
            echo "⏳ Esperando 10 segundos para warm-up..."
            sleep 10
            
            echo "✅ Verificando health check..."
            curl -f http://localhost:3000/api/health || echo "⚠️  Health check falló"
            
            echo ""
            echo "✅ Deployment completado!"
EOF
        
        log_success "Deployment Docker completado"
        ;;
        
    3)
        echo ""
        echo "🔄 DEPLOYMENT PM2"
        echo "================"
        read -p "IP del servidor: " server_ip
        read -p "Usuario SSH: " ssh_user
        read -p "Path de la app: " app_path
        
        echo ""
        echo "📤 Conectando a $ssh_user@$server_ip..."
        
        ssh $ssh_user@$server_ip << EOF
            set -e
            echo "📂 Navegando a $app_path"
            cd $app_path
            
            echo "🔽 Pulling latest code..."
            git pull origin main
            
            echo "📦 Instalando dependencias..."
            npm install
            
            echo "🏗️  Building Next.js..."
            npm run build
            
            echo "🔄 Reloading PM2 (zero-downtime)..."
            pm2 reload inmova-app || pm2 restart inmova-app
            
            echo "⏳ Esperando 5 segundos..."
            sleep 5
            
            echo "✅ Verificando..."
            curl -f http://localhost:3000/api/health || echo "⚠️  Health check falló"
            
            echo ""
            echo "📊 PM2 Status:"
            pm2 status inmova-app
            
            echo ""
            echo "✅ Deployment completado!"
EOF
        
        log_success "Deployment PM2 completado"
        ;;
        
    4)
        echo ""
        echo "📝 SOLO COMMIT"
        echo "============="
        
        if [ -n "$(git status --porcelain)" ]; then
            git add components/landing/sections/PromoBanner.tsx \
                    next.config.js \
                    components/forms/AccessibleFormField.tsx \
                    app/globals.css \
                    public/og-image-template.svg
            
            git commit -m "fix: frontend audit corrections - WCAG AA, security headers, responsive mobile

- Mejorado contraste de colores (WCAG 2.1 AA)
- Añadidos headers de seguridad HTTP (CSP, X-Frame-Options, HSTS)
- Implementado autocomplete en formularios
- Corregido overflow horizontal en móvil
- Aumentados touch targets a 48x48px mínimo
- Creada imagen Open Graph (1200x630px)

Fixes 13 critical frontend issues detected in Playwright audit."
            
            log_success "Commit creado. Ahora puedes:"
            echo "   git push origin $(git branch --show-current)"
        else
            log_warning "No hay cambios para commitear"
        fi
        ;;
        
    *)
        log_error "Opción inválida"
        exit 1
        ;;
esac

# Paso 5: Resumen final
echo ""
echo "✅ =========================================="
echo "   DEPLOYMENT COMPLETADO"
echo "=========================================="
echo ""
echo "📋 Próximos pasos:"
echo "   1. Espera 2-3 minutos para propagación"
echo "   2. Verifica: https://inmovaapp.com/landing"
echo "   3. Test headers: curl -I https://inmovaapp.com"
echo "   4. Run Playwright tests:"
echo "      npx playwright test e2e/frontend-audit-intensive.spec.ts"
echo ""
echo "📊 Checklist:"
echo "   [ ] Landing page carga sin errores"
echo "   [ ] Login page tiene autocomplete"
echo "   [ ] Headers de seguridad presentes"
echo "   [ ] Contraste de colores mejorado"
echo "   [ ] Responsive móvil sin overflow"
echo "   [ ] Touch targets ≥48px"
echo ""
log_success "Todo listo! 🎉"
