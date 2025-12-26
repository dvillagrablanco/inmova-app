#!/bin/bash

# Script de migración para ewoorker
# Usar después del deployment en Vercel

echo "🏗️ MIGRACIONES EWOORKER - INMOVA"
echo "================================"
echo ""

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    echo "   Configura la variable de entorno antes de ejecutar"
    exit 1
fi

echo "✅ DATABASE_URL configurada"
echo ""

# Opción 1: Usar Prisma (si funciona)
echo "📦 Intentando migración con Prisma..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Migración exitosa con Prisma"
else
    echo "⚠️  Prisma 7 tiene problemas de configuración"
    echo ""
    echo "📝 INSTRUCCIONES ALTERNATIVAS:"
    echo "================================"
    echo ""
    echo "Ejecuta estas migraciones manualmente en tu BD PostgreSQL:"
    echo ""
    echo "1. Conectarse a la BD de producción"
    echo "2. Ejecutar el archivo: prisma/migrations/create_ewoorker_tables.sql"
    echo ""
    echo "O usa el Dashboard de Vercel:"
    echo "- Storage → Postgres → Query Editor"
    echo "- Pega el contenido del archivo SQL"
    echo ""
fi

echo ""
echo "🔍 VERIFICACIÓN:"
echo "==============="
echo ""
echo "Verifica que estas tablas existen:"
echo "- ewoorker_perfil_empresa"
echo "- ewoorker_documento"
echo "- ewoorker_obra"
echo "- ewoorker_oferta"
echo "- ewoorker_contrato"
echo "- ewoorker_pago"
echo "- ewoorker_metrica_socio"
echo "- ewoorker_log_socio"
echo ""
echo "Consulta SQL para verificar:"
echo "SELECT tablename FROM pg_tables WHERE tablename LIKE 'ewoorker%';"
echo ""
