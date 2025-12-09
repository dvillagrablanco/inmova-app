#!/bin/bash

# Script de ayuda para configurar Vercel

echo "====================================="
echo "  INMOVA - Setup de Vercel"
echo "====================================="
echo ""

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "ℹ️  Instálalo con: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI detectado"
echo ""

# Verificar archivo .env
if [ ! -f "nextjs_space/.env" ]; then
    echo "⚠️  No se encontró el archivo .env"
    echo "ℹ️  Crea uno basado en .env.example"
    exit 1
fi

echo "✅ Archivo .env encontrado"
echo ""

echo "Pasos siguientes:"
echo ""
echo "1️⃣  Iniciar sesión en Vercel:"
echo "   vercel login"
echo ""
echo "2️⃣  Vincular proyecto:"
echo "   vercel link"
echo ""
echo "3️⃣  Configurar variables de entorno:"
echo "   vercel env add DATABASE_URL production"
echo "   vercel env add NEXTAUTH_SECRET production"
echo "   vercel env add NEXTAUTH_URL production"
echo ""
echo "4️⃣  Desplegar:"
echo "   vercel --prod"
echo ""
echo "====================================="
echo "ℹ️  Lee VERCEL_SETUP.md para más detalles"
echo "====================================="
