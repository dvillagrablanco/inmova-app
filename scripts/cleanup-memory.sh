#!/bin/bash

echo "🧹 Script de Limpieza y Optimización de Memoria - INMOVA"
echo "=========================================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Ejecuta este script desde el directorio nextjs_space"
  exit 1
fi

echo "📊 Análisis de uso de espacio ANTES de la limpieza:"
echo "---------------------------------------------------"
du -sh .build .next uploads logs 2>/dev/null | awk '{print "   " $1 " - " $2}'
echo ""

# Verificar si se pasó el flag --silent
if [[ "$1" != "--silent" ]]; then
  read -p "¿Deseas continuar con la limpieza? (s/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Limpieza cancelada"
    exit 0
  fi
else
  echo "ℹ️  Modo silencioso activado - Continuando automáticamente..."
fi

echo ""
echo "🔧 Iniciando limpieza..."
echo ""

# 1. Limpiar cachés de build
echo "📦 [1/7] Limpiando cachés de Webpack..."
if [ -d ".build/cache" ]; then
  rm -rf .build/cache
  echo "   ✓ Cache de Webpack eliminado"
else
  echo "   ℹ️  No se encontró cache de Webpack"
fi

# 2. Limpiar archivos de log grandes
echo "📋 [2/7] Limpiando archivos de log..."
if [ -f "build-output.log" ]; then
  > build-output.log
  echo "   ✓ build-output.log limpiado"
fi
if [ -f "build.log" ]; then
  > build.log
  echo "   ✓ build.log limpiado"
fi

# 3. Eliminar archivos de backup innecesarios
echo "🗑️  [3/7] Eliminando archivos de backup..."
find . -name "*.backup" -type f -delete 2>/dev/null
find . -name "*.old" -type f -delete 2>/dev/null
find . -name "*.bak" -type f -delete 2>/dev/null
find . -name "next.config.js.backup*" -type f -delete 2>/dev/null
echo "   ✓ Archivos de backup eliminados"

# 4. Limpiar node_modules temporales y cachés
echo "📚 [4/7] Limpiando cachés de dependencias..."
if [ -d ".cache" ]; then
  rm -rf .cache
  echo "   ✓ Cache de dependencias eliminado"
fi

# 5. Limpiar archivos temporales de TypeScript
echo "⚡ [5/7] Limpiando archivos temporales de TypeScript..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null
echo "   ✓ Archivos tsbuildinfo eliminados"

# 6. Limpiar uploads vacíos o temporales
echo "📁 [6/7] Limpiando archivos vacíos en uploads..."
if [ -d "uploads" ]; then
  find uploads -type f -size 0 -delete 2>/dev/null
  echo "   ✓ Archivos vacíos eliminados"
fi

# 7. Limpiar logs antiguos
echo "📜 [7/7] Limpiando logs antiguos (>7 días)..."
if [ -d "logs" ]; then
  find logs -name "*.log" -mtime +7 -delete 2>/dev/null
  echo "   ✓ Logs antiguos eliminados"
fi

echo ""
echo "✨ ¡Limpieza completada con éxito!"
echo ""
echo "📊 Uso de espacio DESPUÉS de la limpieza:"
echo "------------------------------------------"
du -sh .build .next uploads logs 2>/dev/null | awk '{print "   " $1 " - " $2}'
echo ""
echo "💡 Recomendaciones adicionales:"
echo "   1. Ejecuta 'yarn cache clean' para limpiar cache de yarn"
echo "   2. Ejecuta 'yarn prisma generate' si has modificado el schema"
echo "   3. Considera ejecutar este script semanalmente"
echo ""
