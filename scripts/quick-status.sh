#!/bin/bash

echo "📊 Estado Rápido del Proyecto INMOVA"
echo "=========================================="
echo ""

# 1. Espacio en disco
echo "💾 ESPACIO EN DISCO:"
echo "-------------------"
if [ -d ".build" ]; then
  BUILD_SIZE=$(du -sh .build 2>/dev/null | awk '{print $1}')
  echo "   .build/        $BUILD_SIZE"
fi
if [ -d ".next" ]; then
  NEXT_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
  echo "   .next/         $NEXT_SIZE"
fi
if [ -d "logs" ]; then
  LOGS_SIZE=$(du -sh logs 2>/dev/null | awk '{print $1}')
  echo "   logs/          $LOGS_SIZE"
fi
echo ""

# 2. Archivos temporales
echo "🗑️  ARCHIVOS TEMPORALES:"
echo "---------------------"
BACKUP_COUNT=$(find . -name "*.backup" -o -name "*.old" -o -name "*.bak" 2>/dev/null | wc -l)
echo "   Archivos backup:   $BACKUP_COUNT"

TSBUILD_COUNT=$(find . -name "*.tsbuildinfo" 2>/dev/null | wc -l)
echo "   Archivos .tsbuildinfo: $TSBUILD_COUNT"
echo ""

# 3. Análisis de código
if [ -f "analysis-report.json" ]; then
  echo "🔍 ANÁLISIS DE CÓDIGO:"
  echo "--------------------"
  
  HIGH=$(cat analysis-report.json | jq '[.[] | select(.severity == "high")] | length' 2>/dev/null)
  MEDIUM=$(cat analysis-report.json | jq '[.[] | select(.severity == "medium")] | length' 2>/dev/null)
  LOW=$(cat analysis-report.json | jq '[.[] | select(.severity == "low")] | length' 2>/dev/null)
  
  echo "   🔴 Alta severidad:   $HIGH"
  echo "   🟡 Media severidad:  $MEDIUM"
  echo "   🟢 Baja severidad:   $LOW"
  echo ""
else
  echo "⚠️  No se encontró analysis-report.json"
  echo "   Ejecuta: yarn tsx scripts/analyze-typescript.ts"
  echo ""
fi

# 4. Logs recientes
echo "📝 LOGS RECIENTES:"
echo "----------------"
if [ -f "build-output.log" ]; then
  LOG_SIZE=$(du -sh build-output.log 2>/dev/null | awk '{print $1}')
  echo "   build-output.log: $LOG_SIZE"
fi
if [ -f "build.log" ]; then
  LOG_SIZE=$(du -sh build.log 2>/dev/null | awk '{print $1}')
  echo "   build.log:        $LOG_SIZE"
fi
if [ -d "logs" ]; then
  LOG_COUNT=$(find logs -name "*.log" 2>/dev/null | wc -l)
  echo "   Archivos de log:  $LOG_COUNT"
fi
echo ""

# 5. Recomendaciones
echo "💡 RECOMENDACIONES:"
echo "------------------"

if [ ! -z "$BUILD_SIZE" ] && [ "${BUILD_SIZE//[^0-9]/}" -gt 1000 ]; then
  echo "   ⚠️  .build/ es muy grande ($BUILD_SIZE)"
  echo "      ➜ Ejecuta: ./scripts/cleanup-memory.sh"
fi

if [ "$BACKUP_COUNT" -gt 5 ]; then
  echo "   ⚠️  Muchos archivos backup ($BACKUP_COUNT)"
  echo "      ➜ Ejecuta: ./scripts/cleanup-memory.sh"
fi

if [ ! -z "$HIGH" ] && [ "$HIGH" -gt 0 ]; then
  echo "   ⚠️  $HIGH problemas de alta severidad detectados"
  echo "      ➜ Revisa: analysis-report.json"
fi

if [ ! -f "analysis-report.json" ]; then
  echo "   🔄 Ejecuta análisis de código"
  echo "      ➜ yarn tsx scripts/analyze-typescript.ts"
fi

echo ""
echo "✅ Análisis completo. Para más detalles, revisa:"
echo "   - RESUMEN_OPTIMIZACION.md"
echo "   - OPTIMIZACION_MEMORIA.md"
echo ""
