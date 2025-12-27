#!/bin/bash

# Script para generar secrets necesarios para deployment en Vercel

echo "🔐 Generando secrets para INMOVA..."
echo ""

echo "1️⃣ NEXTAUTH_SECRET (32 caracteres aleatorios):"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""

echo "2️⃣ ENCRYPTION_KEY (64 caracteres hexadecimales):"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo ""

echo "3️⃣ CRON_SECRET (64 caracteres hexadecimales):"
echo "CRON_SECRET=$(openssl rand -hex 32)"
echo ""

echo "✅ Copia estos valores y añádelos como variables de entorno en Vercel"
echo ""
echo "📝 Para añadirlos en Vercel:"
echo "   1. Ve a https://vercel.com/tu-proyecto/settings/environment-variables"
echo "   2. Añade cada variable"
echo "   3. Selecciona 'Production', 'Preview' y 'Development'"
echo "   4. Haz clic en 'Save'"
echo ""
