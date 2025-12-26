#!/bin/bash
# Script final para corregir TODOS los archivos JSX problemáticos

echo "🔧 Corrección final de archivos JSX..."

# Edificios - necesita Fragment
sed -i '591s/return (/return (\n    <>/' app/edificios/page.tsx
sed -i '606s|</AuthenticatedLayout>|</AuthenticatedLayout>\n    </>|' app/edificios/page.tsx

# Home-mobile - eliminar div extra
sed -i '305d' app/home-mobile/page.tsx

# Mantenimiento - necesita Fragment
sed -i '1057s|</div>|</div>\n      </AuthenticatedLayout>\n\n      {/* Modal para Crear/Editar Preventivo */}\n      {showModal \&\& (|' app/mantenimiento/page.tsx
sed -i '1058,1061d' app/mantenimiento/page.tsx

# Onboarding - falta abrir div
sed -i '76s|<div className="container|      <div className="container|' app/onboarding/page.tsx
sed -i '247s|</div>|        </div>\n      </div>|' app/onboarding/page.tsx

# Open-banking - eliminar div extra
sed -i '616d' app/open-banking/page.tsx

# Partners - eliminar div extra  
sed -i '86d' app/partners/dashboard/page.tsx

# Portal-proveedor - eliminar div extra
sed -i '183d' app/portal-proveedor/dashboard/page.tsx

# Publicaciones - eliminar main y agregar cierre correcto
sed -i '340,341d' app/publicaciones/page.tsx

echo "✅ Correcciones aplicadas"

# Formatear con Prettier
echo "📝 Formateando archivos..."
npx prettier --write \
  app/edificios/page.tsx \
  app/home-mobile/page.tsx \
  app/mantenimiento/page.tsx \
  app/onboarding/page.tsx \
  app/open-banking/page.tsx \
  app/ordenes-trabajo/page.tsx \
  app/partners/dashboard/page.tsx \
  app/portal-proveedor/dashboard/page.tsx \
  app/publicaciones/page.tsx \
  --log-level error 2>&1 | grep -v "Checking" || true

echo "✅ Proceso completado"
