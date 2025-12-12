#!/bin/bash

# Script para actualizar DATABASE_URL con sslmode=require
# Realiza un backup del .env original antes de modificar

set -e

echo "🔒 Actualizador de Configuración SSL para PostgreSQL"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo "❌ ERROR: Archivo .env no encontrado"
    exit 1
fi

# Crear backup
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"
echo "✅ Backup creado: $BACKUP_FILE"
echo ""

# Leer DATABASE_URL actual
CURRENT_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d "'\"")

if [ -z "$CURRENT_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no encontrada en .env"
    exit 1
fi

echo "📋 DATABASE_URL actual:"
echo "   ${CURRENT_URL:0:80}..."
echo ""

# Verificar si ya tiene sslmode
if [[ $CURRENT_URL == *"sslmode="* ]]; then
    echo "⚠️  DATABASE_URL ya incluye configuración de sslmode"
    echo ""
    read -p "¿Desea actualizar a sslmode=require de todas formas? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operación cancelada"
        exit 0
    fi
    
    # Remover sslmode existente
    CURRENT_URL=$(echo "$CURRENT_URL" | sed 's/&sslmode=[^&]*//g' | sed 's/\?sslmode=[^&]*&/\?/g' | sed 's/\?sslmode=[^&]*$//')
fi

# Agregar sslmode=require
if [[ $CURRENT_URL == *"?"* ]]; then
    # Ya tiene query parameters
    NEW_URL="${CURRENT_URL}&sslmode=require"
else
    # No tiene query parameters
    NEW_URL="${CURRENT_URL}?sslmode=require"
fi

echo "📋 Nueva DATABASE_URL:"
echo "   ${NEW_URL:0:80}..."
echo ""

# Confirmar cambio
read -p "¿Confirma aplicar los cambios? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    rm "$BACKUP_FILE"
    exit 0
fi

# Aplicar cambio (manejar comillas correctamente)
if [[ $CURRENT_URL == *"'"* ]]; then
    # URL tenía comillas simples
    sed -i.tmp "s|^DATABASE_URL='.*'|DATABASE_URL='${NEW_URL}'|g" .env
else
    # URL sin comillas
    sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL='${NEW_URL}'|g" .env
fi

rm .env.tmp 2>/dev/null || true

echo "✅ DATABASE_URL actualizada con éxito"
echo ""
echo "📝 Instrucciones siguientes:"
echo "   1. Verifica la conexión a la base de datos"
echo "   2. Reinicia la aplicación Next.js"
echo "   3. Confirma que todo funciona correctamente"
echo "   4. Si hay problemas, restaura con:"
echo "      cp $BACKUP_FILE .env"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✨ Configuración SSL actualizada exitosamente"
echo "═══════════════════════════════════════════════════════════════"
echo ""
