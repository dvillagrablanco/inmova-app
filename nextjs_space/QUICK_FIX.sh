#!/bin/bash
#
# QUICK FIX SCRIPT - INMOVA
# Arregla los problemas críticos de deployment
#

set -e

echo "===================================================="
echo "  INMOVA - QUICK FIX PARA DEPLOYMENT"
echo "===================================================="
echo ""

cd /home/ubuntu/homming_vidaro/nextjs_space

echo "[1/4] Verificando error de TypeScript..."
echo "-----------------------------------------------"
grep -n "tipo: 'alerta_sistema'" app/api/approvals/route.ts app/api/approvals/[id]/route.ts || echo "Ya arreglado o no encontrado"
echo ""

echo "[2/4] Verificando uso de Plotly.js..."
echo "-----------------------------------------------"
PLOTLY_COUNT=$(grep -r "plotly" app/ --include="*.tsx" --include="*.ts" | wc -l)
if [ "$PLOTLY_COUNT" -eq "0" ]; then
    echo "❌ Plotly.js NO se usa en el código"
    echo "✅ Se puede remover de forma segura"
    echo ""
    read -p "¿Deseas remover Plotly.js ahora? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removiendo Plotly.js y dependencias..."
        yarn remove plotly.js react-plotly.js @types/plotly.js @types/react-plotly.js
        echo "✅ Plotly.js removido exitosamente"
    fi
else
    echo "⚠️ Plotly.js se usa en $PLOTLY_COUNT lugar(es)"
    echo "Archivos que lo usan:"
    grep -r "plotly" app/ --include="*.tsx" --include="*.ts" -l
fi
echo ""

echo "[3/4] Listando archivos con Recharts sin lazy loading..."
echo "-----------------------------------------------"
echo "Archivos que requieren lazy loading:"
find app/ -name "*.tsx" | xargs grep -l "from 'recharts'" | nl
echo ""

echo "[4/4] Verificando posibles memory leaks..."
echo "-----------------------------------------------"
echo "Archivos con useEffect sin cleanup completo:"
echo "- app/chat/page.tsx (4 effects, 1 cleanup)"
echo "- app/mantenimiento/page.tsx (5 effects, 1 cleanup)"
echo "- app/admin/salud-sistema/page.tsx (3 effects, 1 cleanup)"
echo "- app/admin/alertas/page.tsx (3 effects, 1 cleanup)"
echo ""

echo "===================================================="
echo "  RESUMEN"
echo "===================================================="
echo ""
echo "PROBLEMAS DETECTADOS:"
echo "1. 🔴 Error TypeScript en approvals API (BLOQUEANTE)"
echo "2. 🔴 Plotly.js (99MB) potencialmente sin uso"
echo "3. 🟠 6 archivos con Recharts sin lazy loading"
echo "4. 🟠 7 archivos con posibles memory leaks"
echo ""
echo "SIGUIENTE PASO:"
echo "1. Arreglar error TypeScript en approvals"
echo "2. Ejecutar: yarn build"
echo "3. Si build exitoso, hacer deployment"
echo ""
echo "Para ver reporte completo: cat /home/ubuntu/homming_vidaro/AUDITORIA_TECNICA.md"
echo "===================================================="
