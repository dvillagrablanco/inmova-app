#!/bin/bash

# Script para desplegar en Vercel
echo "🚀 Preparando despliegue en Vercel..."

# Instalar Vercel CLI si no está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Instrucciones de login
echo ""
echo "🔐 Para continuar, ejecuta: vercel login"
echo "   Email: dvillagra@vidaroinversiones.com"
echo "   Contraseña: Pucela00"
echo "   Código (si se solicita): 220194"
echo ""
echo "Después ejecuta: vercel --prod"
