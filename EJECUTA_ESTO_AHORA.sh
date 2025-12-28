#!/bin/bash

# ============================================
# EJECUTA ESTOS COMANDOS UNO POR UNO
# ============================================

echo "🚀 DEPLOYMENT FINAL - Base de datos ya creada"
echo ""
echo "Ejecuta estos comandos uno por uno en tu terminal:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Login
echo "1️⃣  LOGIN EN VERCEL"
echo "   vercel login"
echo ""

# 2. Link
echo "2️⃣  LINK PROYECTO"
echo "   cd /workspace"
echo "   vercel link"
echo ""

# 3. Variables
echo "3️⃣  DESCARGAR DATABASE_URL"
echo "   vercel env pull .env.local"
echo "   export \$(cat .env.local | grep DATABASE_URL | xargs)"
echo ""

# 4. Prisma
echo "4️⃣  GENERAR PRISMA CLIENT"
echo "   npx prisma generate"
echo ""

# 5. Migraciones
echo "5️⃣  APLICAR MIGRACIONES"
echo "   npx prisma migrate deploy"
echo ""

# 6. Seed
echo "6️⃣  CREAR DATOS INICIALES"
echo "   npm run db:seed"
echo ""

# 7. Deploy
echo "7️⃣  DEPLOY A PRODUCCIÓN"
echo "   vercel --prod"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Después de ejecutar todo:"
echo ""
echo "   Tu app estará en: https://tu-proyecto.vercel.app"
echo "   Login: admin@inmova.app / Admin2025!"
echo ""
echo "⏱️  Tiempo total: 3 minutos"
echo ""
