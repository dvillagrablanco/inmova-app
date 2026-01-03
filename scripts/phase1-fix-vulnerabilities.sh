#!/bin/bash
#######################################
# FIX DE VULNERABILIDADES NPM
# Script para corregir vulnerabilidades detectadas
# Uso: bash phase1-fix-vulnerabilities.sh
#######################################

set -e

echo "======================================================================"
echo "🔒 FIX DE VULNERABILIDADES NPM"
echo "======================================================================"
echo ""

cd /opt/inmova-app

# Backup de package.json y package-lock.json
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)
cp package-lock.json package-lock.json.backup.$(date +%Y%m%d_%H%M%S)

echo "✅ Backup de package files creado"

# Ejecutar audit
echo ""
echo "Vulnerabilidades actuales:"
npm audit --production

echo ""
echo "======================================================================"
echo "Aplicando fixes automáticos..."
echo "======================================================================"

# Fix automático de vulnerabilidades que no requieren breaking changes
npm audit fix

echo ""
echo "======================================================================"
echo "Vulnerabilidades restantes:"
echo "======================================================================"

npm audit --production

echo ""
echo "======================================================================"
echo "📋 VULNERABILIDADES ESPECÍFICAS DETECTADAS"
echo "======================================================================"
echo ""

# Vulnerabilidad 1: next-auth < 4.24.12
echo "1. next-auth Email misdelivery (MODERATE)"
echo "   Versión actual: $(npm list next-auth --depth=0 | grep next-auth | awk '{print $2}')"
echo "   Fix recomendado: Actualizar a 4.24.13"
echo ""

if npm list next-auth --depth=0 | grep -q "4.24.11"; then
    read -p "   ¿Actualizar next-auth a 4.24.13? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install next-auth@4.24.13
        echo "   ✅ next-auth actualizado"
    fi
fi

# Vulnerabilidad 2: postcss < 8.4.31
echo "2. postcss line return parsing error (MODERATE)"
echo "   Versión actual: $(npm list postcss --depth=0 | grep postcss | awk '{print $2}' || echo 'No instalado directamente')"
echo "   Fix: Generalmente se resuelve actualizando tailwindcss"
echo ""

# Vulnerabilidad 3: qs < 6.14.1
echo "3. qs arrayLimit bypass DoS (HIGH)"
echo "   Versión actual: $(npm list qs --depth=0 | grep qs | awk '{print $2}' || echo 'Dependencia transitiva')"
echo "   Fix recomendado: npm audit fix"
echo ""

# Vulnerabilidad 4: xlsx (Prototype Pollution)
echo "4. xlsx Prototype Pollution (HIGH)"
echo "   ⚠️  NO HAY FIX DISPONIBLE"
echo "   Recomendación: Considerar alternativa (exceljs, sheetjs-style)"
echo "   O esperar a que el maintainer publique fix"
echo ""

# Verificar si hay mejoras
echo ""
echo "======================================================================"
echo "Verificando mejoras después de fix..."
echo "======================================================================"

VULNS_BEFORE=$(npm audit --production 2>&1 | grep "vulnerabilities" | head -1)
echo "Estado final: $VULNS_BEFORE"

echo ""
echo "======================================================================"
echo "🔧 RECOMENDACIONES ADICIONALES"
echo "======================================================================"
echo ""

echo "1. xlsx (NO FIX DISPONIBLE):"
echo "   - Evaluar si xlsx es crítico para la app"
echo "   - Si no se usa: npm uninstall xlsx"
echo "   - Si se usa: Migrar a alternativa segura (exceljs)"
echo ""

echo "2. Dependencias transitivas:"
echo "   - Algunas vulnerabilidades vienen de dependencias de otras librerías"
echo "   - Esperar a que los maintainers actualicen"
echo ""

echo "3. Monitoring continuo:"
echo "   - Ejecutar 'npm audit' semanalmente"
echo "   - Configurar Dependabot en GitHub"
echo ""

echo "✅ Fix de vulnerabilidades completado"
echo ""
echo "Resumen:"
echo "- Vulnerabilidades fixeadas: Ver output de npm audit fix"
echo "- Vulnerabilidades restantes: Verificar npm audit"
echo "- Backups guardados: package.json.backup.*"
echo ""
