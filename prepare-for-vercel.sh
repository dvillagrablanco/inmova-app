#!/bin/bash

# Script para preparar la aplicación para deployment en Vercel
# Autor: DeepAgent
# Fecha: 5 de diciembre de 2024

set -e  # Salir si hay error

echo "🚀 ============================================"
echo "   Preparando INMOVA para Vercel"
echo "   ============================================"
echo ""

PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"

cd "$PROJECT_DIR" || exit 1

echo "✅ Paso 1: Verificando estructura del proyecto..."
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se encontró package.json"
  exit 1
fi
echo "   ✅ package.json encontrado"

if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ Error: No se encontró schema.prisma"
  exit 1
fi
echo "   ✅ schema.prisma encontrado"

echo ""
echo "✅ Paso 2: Haciendo backup de next.config.js..."
if [ -f "next.config.js" ]; then
  cp next.config.js next.config.js.backup.$(date +%Y%m%d_%H%M%S)
  echo "   ✅ Backup creado"
fi

echo ""
echo "✅ Paso 3: Reemplazando next.config.js con versión para Vercel..."
if [ -f "next.config.vercel.js" ]; then
  cp next.config.vercel.js next.config.js
  echo "   ✅ next.config.js actualizado"
else
  echo "   ⚠️  Warning: next.config.vercel.js no encontrado"
fi

echo ""
echo "✅ Paso 4: Creando .vercelignore..."
cat > .vercelignore << 'EOF'
node_modules
.next
.build
core
*.log
.env.local
.DS_Store
.swc
*.tsbuildinfo
EOF
echo "   ✅ .vercelignore creado"

echo ""
echo "✅ Paso 5: Verificando .gitignore..."
if [ ! -f ".gitignore" ]; then
  echo "   🔧 Creando .gitignore..."
  cat > .gitignore << 'EOF'
node_modules
.next
.build
.env
.env.local
*.log
core
.DS_Store
.swc
*.tsbuildinfo
EOF
else
  echo "   ✅ .gitignore ya existe"
fi

echo ""
echo "✅ Paso 6: Generando Prisma Client..."
if command -v yarn &> /dev/null; then
  yarn prisma generate
  echo "   ✅ Prisma Client generado"
else
  echo "   ❌ Error: yarn no está instalado"
  exit 1
fi

echo ""
echo "✅ Paso 7: Verificando build..."
echo "   (Esto puede tardar unos minutos...)"
if yarn build; then
  echo "   ✅ Build exitoso"
else
  echo "   ❌ Error: Build falló"
  echo "   Por favor revisa los errores arriba antes de hacer deploy"
  exit 1
fi

echo ""
echo "✅ Paso 8: Verificando variables de entorno críticas..."
MISSING_VARS=()

if [ -f ".env" ]; then
  REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "AWS_BUCKET_NAME"
    "ENCRYPTION_KEY"
  )
  
  for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$VAR=" .env; then
      MISSING_VARS+=("$VAR")
    fi
  done
  
  if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "   ✅ Todas las variables críticas están presentes"
  else
    echo "   ⚠️  Variables faltantes: ${MISSING_VARS[*]}"
    echo "   Asegúrate de configurarlas en Vercel"
  fi
else
  echo "   ⚠️  .env no encontrado (normal en producción)"
  echo "   Asegúrate de configurar todas las variables en Vercel"
fi

echo ""
echo "✅ Paso 9: Limpiando archivos innecesarios..."
rm -rf .next .build *.log 2>/dev/null || true
echo "   ✅ Limpieza completada"

echo ""
echo "✅ Paso 10: Verificando tamaño de archivos..."
LARGE_FILES=$(find . -type f -size +100M 2>/dev/null | grep -v node_modules | grep -v .git || true)
if [ -n "$LARGE_FILES" ]; then
  echo "   ⚠️  Archivos grandes encontrados (> 100MB):"
  echo "$LARGE_FILES" | sed 's/^/      /'
  echo "   Considera excluirlos del deployment"
else
  echo "   ✅ No hay archivos grandes"
fi

echo ""
echo "🎉 ============================================"
echo "   ¡Preparación Completada!"
echo "   ============================================"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Sube el código a Git:"
echo "   git add ."
echo "   git commit -m 'Preparado para Vercel'"
echo "   git push origin main"
echo ""
echo "2. Ve a vercel.com y crea un nuevo proyecto"
echo ""
echo "3. Consulta estos documentos:"
echo "   - QUICK_START_VERCEL.md (guía rápida)"
echo "   - DEPLOYMENT_VERCEL.md (guía completa)"
echo "   - VERCEL_MIGRATION_CHECKLIST.md (checklist)"
echo ""
echo "🚀 ¡Buena suerte con el deployment!"
echo ""
