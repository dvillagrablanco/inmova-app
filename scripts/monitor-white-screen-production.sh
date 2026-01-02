#!/bin/bash

# Script de Monitoreo: Pantalla Blanca en Producción
# Revisa logs y métricas de la solución implementada

set -e

echo "📊 Monitoreo: Solución de Pantalla Blanca"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
LOG_DIR="logs"
REPORT_FILE="white-screen-report-$(date +%Y%m%d_%H%M%S).txt"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

echo "Generando reporte de monitoreo..."
echo ""

{
  echo "==================================="
  echo "REPORTE DE MONITOREO"
  echo "Fecha: $(date)"
  echo "==================================="
  echo ""

  # 1. Verificar que los componentes están instalados
  echo "1. COMPONENTES INSTALADOS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "components/ui/enhanced-error-boundary.tsx" ]; then
    echo "✅ EnhancedErrorBoundary instalado"
  else
    echo "❌ EnhancedErrorBoundary NO encontrado"
  fi
  
  if [ -f "lib/white-screen-detector.ts" ]; then
    echo "✅ WhiteScreenDetector instalado"
  else
    echo "❌ WhiteScreenDetector NO encontrado"
  fi
  
  if [ -f "components/WhiteScreenMonitor.tsx" ]; then
    echo "✅ WhiteScreenMonitor instalado"
  else
    echo "❌ WhiteScreenMonitor NO encontrado"
  fi
  
  echo ""

  # 2. Buscar eventos de White Screen en logs
  echo "2. EVENTOS DE PANTALLA BLANCA"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "$LOG_DIR/combined.log" ]; then
    white_screen_events=$(grep -i "white screen detected" "$LOG_DIR/combined.log" 2>/dev/null | wc -l)
    echo "Total de eventos detectados: $white_screen_events"
    
    if [ $white_screen_events -gt 0 ]; then
      echo ""
      echo "Últimos 5 eventos:"
      grep -i "white screen detected" "$LOG_DIR/combined.log" 2>/dev/null | tail -5
    fi
  else
    echo "⚠️  Log file no encontrado: $LOG_DIR/combined.log"
  fi
  
  echo ""

  # 3. Buscar errores capturados por ErrorBoundary
  echo "3. ERRORES CAPTURADOS POR ERROR BOUNDARY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "$LOG_DIR/error.log" ]; then
    error_boundary_events=$(grep -i "EnhancedErrorBoundary" "$LOG_DIR/error.log" 2>/dev/null | wc -l)
    echo "Total de errores capturados: $error_boundary_events"
    
    if [ $error_boundary_events -gt 0 ]; then
      echo ""
      echo "Últimos 5 errores:"
      grep -i "EnhancedErrorBoundary" "$LOG_DIR/error.log" 2>/dev/null | tail -5
    fi
  else
    echo "⚠️  Log file no encontrado: $LOG_DIR/error.log"
  fi
  
  echo ""

  # 4. Buscar eventos de recuperación automática
  echo "4. RECUPERACIONES AUTOMÁTICAS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "$LOG_DIR/combined.log" ]; then
    recovery_events=$(grep -i "recovery" "$LOG_DIR/combined.log" 2>/dev/null | grep -i "white screen" | wc -l)
    echo "Total de recuperaciones: $recovery_events"
    
    if [ $recovery_events -gt 0 ]; then
      echo ""
      echo "Últimos 5 eventos de recuperación:"
      grep -i "recovery" "$LOG_DIR/combined.log" 2>/dev/null | grep -i "white screen" | tail -5
    fi
  fi
  
  echo ""

  # 5. Métricas calculadas
  echo "5. MÉTRICAS CLAVE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "$LOG_DIR/combined.log" ]; then
    # Buscar en las últimas 24 horas (aproximado)
    white_screen_24h=$(grep -i "white screen detected" "$LOG_DIR/combined.log" 2>/dev/null | tail -100 | wc -l)
    recovery_24h=$(grep -i "recovery" "$LOG_DIR/combined.log" 2>/dev/null | grep -i "white screen" | tail -100 | wc -l)
    
    echo "Últimas 24 horas (aprox):"
    echo "  • Pantallas blancas detectadas: $white_screen_24h"
    echo "  • Recuperaciones exitosas: $recovery_24h"
    
    if [ $white_screen_24h -gt 0 ]; then
      recovery_rate=$(( recovery_24h * 100 / white_screen_24h ))
      echo "  • Tasa de recuperación: ${recovery_rate}%"
      
      if [ $recovery_rate -ge 80 ]; then
        echo "  → ✅ Objetivo alcanzado (>80%)"
      else
        echo "  → ⚠️  Por debajo del objetivo (>80%)"
      fi
    else
      echo "  → ✅ Sin incidentes de pantalla blanca"
    fi
  fi
  
  echo ""

  # 6. Recomendaciones
  echo "6. RECOMENDACIONES"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ $white_screen_24h -eq 0 ]; then
    echo "✅ La solución está funcionando correctamente"
    echo "   • Continuar monitoreando durante 1 semana"
    echo "   • No se requieren ajustes"
  elif [ $white_screen_24h -lt 5 ]; then
    echo "⚠️  Pocos incidentes detectados"
    echo "   • Revisar logs detallados para identificar patrones"
    echo "   • Considerar ajustar thresholds de detección"
  else
    echo "🔴 Múltiples incidentes detectados"
    echo "   • Revisar causas raíz de los errores"
    echo "   • Optimizar estrategias de recuperación"
    echo "   • Considerar ajustes en EnhancedErrorBoundary"
  fi
  
  echo ""

  # 7. Checklist de validación
  echo "7. CHECKLIST DE VALIDACIÓN"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[ ] EnhancedErrorBoundary captura errores correctamente"
  echo "[ ] WhiteScreenDetector detecta pantallas blancas"
  echo "[ ] Recuperación automática funciona (>80% tasa)"
  echo "[ ] UI de error se muestra correctamente"
  echo "[ ] Logs se envían a servicio de monitoreo (Sentry)"
  echo "[ ] Sin reportes de usuarios de pantalla blanca"
  echo ""

  # 8. Información de contacto
  echo "8. SIGUIENTE ACCIÓN"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Si encuentras problemas:"
  echo "  1. Revisar documentación: .cursorrules-white-screen-solution"
  echo "  2. Ejecutar tests: npx playwright test e2e/white-screen-detection.spec.ts"
  echo "  3. Revisar logs detallados en: $LOG_DIR/"
  echo "  4. Contactar al equipo de desarrollo"
  echo ""

  echo "==================================="
  echo "FIN DEL REPORTE"
  echo "==================================="

} | tee "$LOG_DIR/$REPORT_FILE"

echo ""
echo -e "${GREEN}✅ Reporte generado: $LOG_DIR/$REPORT_FILE${NC}"
echo ""

# Mostrar resumen en terminal
echo -e "${BLUE}📊 RESUMEN EJECUTIVO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$LOG_DIR/combined.log" ]; then
  white_screen_count=$(grep -i "white screen detected" "$LOG_DIR/combined.log" 2>/dev/null | wc -l || echo "0")
  
  if [ "$white_screen_count" -eq 0 ]; then
    echo -e "${GREEN}✅ Sin incidentes de pantalla blanca${NC}"
    echo "   La solución está funcionando correctamente"
  elif [ "$white_screen_count" -lt 5 ]; then
    echo -e "${YELLOW}⚠️  $white_screen_count incidentes detectados${NC}"
    echo "   Revisar logs para más detalles"
  else
    echo -e "${RED}🔴 $white_screen_count incidentes detectados${NC}"
    echo "   Requiere atención inmediata"
  fi
else
  echo -e "${YELLOW}⚠️  No se encontraron logs para analizar${NC}"
  echo "   Asegúrate de que la aplicación esté generando logs en: $LOG_DIR/"
fi

echo ""
echo "Para más detalles, revisa: $LOG_DIR/$REPORT_FILE"
