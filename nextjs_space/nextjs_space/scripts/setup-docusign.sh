#!/bin/bash

# ============================================================================
# Script de Configuración Rápida de DocuSign para Vidaro
# ============================================================================
# Este script instala las dependencias necesarias y verifica la configuración
# de DocuSign en la plataforma INMOVA.
#
# Uso:
#   chmod +x scripts/setup-docusign.sh
#   ./scripts/setup-docusign.sh
# ============================================================================

set -e  # Detener en caso de error

echo "🚀 Configuración de DocuSign para Vidaro"
echo "==========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio nextjs_space"
    echo "   cd /home/ubuntu/homming_vidaro/nextjs_space"
    exit 1
fi

echo "📦 Paso 1: Instalando dependencias necesarias..."
echo "   - docusign-esign (SDK oficial de DocuSign)"
echo "   - jsonwebtoken (para autenticación JWT)"
echo ""

yarn add docusign-esign jsonwebtoken

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""
echo "==========================================="
echo ""
echo "🔍 Paso 2: Verificando configuración..."
echo ""

# Verificar si el archivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

# Verificar variables de entorno
echo "Comprobando variables de entorno de DocuSign:"
echo ""

VARS_MISSING=0

# Función para verificar variable
check_var() {
    VAR_NAME=$1
    VAR_VALUE=$(grep "^$VAR_NAME=" .env 2>/dev/null | cut -d '=' -f 2- | tr -d '"' | tr -d "'")
    
    if [ -z "$VAR_VALUE" ] || [ "$VAR_VALUE" = "tu_${VAR_NAME,,}_aqui" ] || [[ "$VAR_VALUE" == *"placeholder"* ]]; then
        echo "  ❌ $VAR_NAME: NO CONFIGURADO"
        VARS_MISSING=$((VARS_MISSING + 1))
    else
        # Mostrar solo los primeros caracteres para seguridad
        if [ ${#VAR_VALUE} -gt 20 ]; then
            DISPLAY_VALUE="${VAR_VALUE:0:20}..."
        else
            DISPLAY_VALUE="$VAR_VALUE"
        fi
        echo "  ✅ $VAR_NAME: Configurado ($DISPLAY_VALUE)"
    fi
}

check_var "DOCUSIGN_INTEGRATION_KEY"
check_var "DOCUSIGN_USER_ID"
check_var "DOCUSIGN_ACCOUNT_ID"
check_var "DOCUSIGN_PRIVATE_KEY"
check_var "DOCUSIGN_BASE_PATH"

echo ""
echo "==========================================="
echo ""

if [ $VARS_MISSING -gt 0 ]; then
    echo "⚠️  ADVERTENCIA: $VARS_MISSING variable(s) no configurada(s)"
    echo ""
    echo "Para completar la configuración:"
    echo ""
    echo "1. Obtén las credenciales de DocuSign desde:"
    echo "   https://developers.docusign.com/"
    echo ""
    echo "2. Edita el archivo .env y reemplaza los valores placeholder:"
    echo "   nano .env"
    echo ""
    echo "3. Consulta la guía completa en:"
    echo "   /home/ubuntu/homming_vidaro/INTEGRACION_DOCUSIGN_VIDARO.md"
    echo ""
    echo "4. Vuelve a ejecutar este script para verificar"
    echo ""
    exit 1
fi

echo "✅ Todas las variables de DocuSign están configuradas"
echo ""

echo "==========================================="
echo ""
echo "🔧 Paso 3: Generando cliente Prisma..."
echo ""

yarn prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Cliente Prisma generado correctamente"
else
    echo "❌ Error al generar cliente Prisma"
    exit 1
fi

echo ""
echo "==========================================="
echo ""
echo "✅ ¡Configuración completada exitosamente!"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Reinicia el servidor de desarrollo:"
echo "   yarn dev"
echo ""
echo "2. Prueba la integración desde la interfaz:"
echo "   - Accede a: https://inmova.app/firma-digital"
echo "   - Crea una solicitud de firma de prueba"
echo ""
echo "3. Verifica los logs:"
echo "   tail -f logs/combined.log | grep DocuSign"
echo ""
echo "4. Consulta la guía completa:"
echo "   cat /home/ubuntu/homming_vidaro/INTEGRACION_DOCUSIGN_VIDARO.md"
echo ""
echo "🚀 Integración lista para usar!"
echo ""