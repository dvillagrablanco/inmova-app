#!/bin/bash
# Script para desplegar todas las páginas corregidas al servidor

echo "📦 Desplegando páginas corregidas al servidor..."
echo ""

# Ya corregimos en local: edificios, candidatos
# Ahora vamos a desplegar el resto

PAGES=(
  "inquilinos"
  "contratos" 
  "reportes"
  "analytics"
  "facturacion"
  "perfil"
)

echo "✅ Páginas YA corregidas en servidor:"
echo "  - /app/edificios/page.tsx"
echo "  - /app/candidatos/page.tsx"
echo ""

echo "🔄 Copiando resto de páginas al servidor..."

# Copiar inquilinos
echo "📄 Copiando inquilinos..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/inquilinos/page.tsx root@157.180.119.236:/tmp/inquilinos-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/inquilinos-fixed.tsx inmova:/app/app/inquilinos/page.tsx"

# Copiar contratos
echo "📄 Copiando contratos..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/contratos/page.tsx root@157.180.119.236:/tmp/contratos-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/contratos-fixed.tsx inmova:/app/app/contratos/page.tsx"

# Copiar reportes
echo "📄 Copiando reportes..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/reportes/page.tsx root@157.180.119.236:/tmp/reportes-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/reportes-fixed.tsx inmova:/app/app/reportes/page.tsx"

# Copiar analytics
echo "📄 Copiando analytics..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/analytics/page.tsx root@157.180.119.236:/tmp/analytics-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/analytics-fixed.tsx inmova:/app/app/analytics/page.tsx"

# Copiar facturacion
echo "📄 Copiando facturacion..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/facturacion/page.tsx root@157.180.119.236:/tmp/facturacion-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/facturacion-fixed.tsx inmova:/app/app/facturacion/page.tsx"

# Copiar perfil
echo "📄 Copiando perfil..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/perfil/page.tsx root@157.180.119.236:/tmp/perfil-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/perfil-fixed.tsx inmova:/app/app/perfil/page.tsx"

# Copiar configuracion
echo "📄 Copiando configuracion..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' scp /workspace/app/admin/configuracion/page.tsx root@157.180.119.236:/tmp/configuracion-fixed.tsx
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker cp /tmp/configuracion-fixed.tsx inmova:/app/app/admin/configuracion/page.tsx"

echo ""
echo "✅ Todos los archivos copiados"
echo ""
echo "🔄 Reiniciando contenedor para aplicar cambios..."
/usr/bin/sshpass -p 'Xe3EMxHgqrUm' ssh root@157.180.119.236 "docker restart inmova"

echo ""
echo "✅ Despliegue completado"
echo "⏳ Esperando 60 segundos para que el servidor reinicie..."
sleep 60

echo ""
echo "🎉 LISTO PARA PROBAR!"
