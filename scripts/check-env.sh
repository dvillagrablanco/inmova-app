#!/bin/bash

# Script para verificar variables de entorno requeridas

echo "====================================="
echo "  Verificación de Variables de Entorno"
echo "====================================="
echo ""

ENV_FILE="nextjs_space/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Archivo .env no encontrado"
    exit 1
fi

# Variables requeridas
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "AWS_REGION"
    "AWS_BUCKET_NAME"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" "$ENV_FILE"; then
        value=$(grep "^$var=" "$ENV_FILE" | cut -d'=' -f2-)
        if [ -z "$value" ] || [ "$value" = "<tu-" ]; then
            echo "⚠️  $var está definida pero sin valor"
            MISSING_VARS+=("$var")
        else
            echo "✅ $var configurada"
        fi
    else
        echo "❌ $var no encontrada"
        MISSING_VARS+=("$var")
    fi
done

echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ Todas las variables requeridas están configuradas"
    exit 0
else
    echo "⚠️  Faltan configurar ${#MISSING_VARS[@]} variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi
