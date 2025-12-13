#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "   🔍 DIAGNÓSTICO RAILWAY - VERIFICACIÓN COMPLETA"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Verificar repositorio local
echo "1️⃣  REPOSITORIO LOCAL"
echo "───────────────────────────────────────────────────────────"
echo "Último commit:"
git log --oneline -1
echo ""
echo "Remote configurado:"
git remote -v | grep origin | head -1
echo ""
echo "Branch actual:"
git branch --show-current
echo ""

# 2. Verificar que el commit está en GitHub
echo "2️⃣  COMMIT EN GITHUB"
echo "───────────────────────────────────────────────────────────"
echo "Último commit en origin/main:"
git log origin/main --oneline -1
echo ""
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  echo "✅ Local y GitHub están sincronizados"
else
  echo "⚠️  Local y GitHub NO están sincronizados"
  echo "   Local:  $(git rev-parse HEAD)"
  echo "   GitHub: $(git rev-parse origin/main)"
fi
echo ""

# 3. Verificar Dockerfile
echo "3️⃣  DOCKERFILE"
echo "───────────────────────────────────────────────────────────"
if [ -f nextjs_space/Dockerfile ]; then
  echo "✅ Dockerfile existe en nextjs_space/"
  echo ""
  echo "Primeras 10 líneas:"
  head -10 nextjs_space/Dockerfile
else
  echo "❌ Dockerfile NO existe en nextjs_space/"
fi
echo ""

# 4. Verificar railway.toml
echo "4️⃣  RAILWAY.TOML"
echo "───────────────────────────────────────────────────────────"
if [ -f nextjs_space/railway.toml ]; then
  echo "✅ railway.toml existe"
  echo ""
  cat nextjs_space/railway.toml
else
  echo "⚠️  railway.toml NO existe"
fi
echo ""

# 5. Verificar package.json
echo "5️⃣  PACKAGE.JSON"
echo "───────────────────────────────────────────────────────────"
if [ -f nextjs_space/package.json ]; then
  echo "✅ package.json existe"
  echo ""
  echo "Script 'start':"
  grep -A 1 '"start"' nextjs_space/package.json
else
  echo "❌ package.json NO existe"
fi
echo ""

# 6. Verificar estructura
echo "6️⃣  ESTRUCTURA DE ARCHIVOS"
echo "───────────────────────────────────────────────────────────"
echo "Archivos críticos en nextjs_space/:"
ls -lh nextjs_space/ | grep -E "(Dockerfile|railway|package.json|next.config)"
echo ""

# 7. Verificar que los archivos están en Git
echo "7️⃣  ARCHIVOS EN GIT (lo que Railway verá)"
echo "───────────────────────────────────────────────────────────"
echo "Verificando en HEAD:nextjs_space/:"
git ls-tree HEAD:nextjs_space/ | grep -E "(Dockerfile|railway|package.json)" || echo "⚠️  No se encontraron archivos críticos"
echo ""

# 8. Resumen
echo "═══════════════════════════════════════════════════════════"
echo "   ✅ RESUMEN"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Para Railway funcione, necesitas:"
echo "1. ✅ Commit 9c7ccfc9 en GitHub"
echo "2. ✅ Dockerfile en nextjs_space/"
echo "3. ✅ railway.toml en nextjs_space/"
echo "4. ✅ package.json en nextjs_space/"
echo "5. ⚠️  Railway configurado correctamente (verificar en UI)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "   📋 PRÓXIMOS PASOS"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Verificar en Railway Dashboard:"
echo "   https://railway.app/dashboard"
echo ""
echo "2. Ir a Settings → Service y verificar:"
echo "   - Repository: dvillagrablanco/inmova-app"
echo "   - Branch: main"
echo "   - Root Directory: nextjs_space/"
echo "   - Builder: DOCKERFILE"
echo ""
echo "3. Si no ves deployments:"
echo "   - Botón 'New Deployment'"
echo "   - O reconnect GitHub"
echo ""
echo "═══════════════════════════════════════════════════════════"
