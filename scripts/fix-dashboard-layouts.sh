#!/bin/bash
# Script para corregir los dashboards restantes que usan Sidebar + Header

echo "🔧 Corrigiendo dashboards restantes..."

# Lista de dashboards a corregir
DASHBOARDS=(
  "/workspace/app/str/dashboard/page.tsx"
  "/workspace/app/flipping/dashboard/page.tsx"
  "/workspace/app/operador/dashboard/page.tsx"
  "/workspace/app/room-rental/[unitId]/dashboard/page.tsx"
  "/workspace/app/portal-proveedor/dashboard/page.tsx"
  "/workspace/app/partners/dashboard/page.tsx"
)

for file in "${DASHBOARDS[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Procesando: $file"
    
    # Reemplazar estructura de layout en loading state
    sed -i 's|<div className="flex h-screen bg-gradient-bg">|<AuthenticatedLayout>|g' "$file"
    sed -i 's|<div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">||g' "$file"
    sed -i 's|<Sidebar />||g' "$file"
    sed -i 's|<Header />||g' "$file"
    
    # Reemplazar </main></div></div> con </AuthenticatedLayout>
    sed -i 's|</main></div></div>|</AuthenticatedLayout>|g' "$file"
    
    # Limpiar líneas vacías múltiples
    sed -i '/^$/N;/^\n$/D' "$file"
    
    echo "  ✅ Corregido"
  else
    echo "  ⚠️  No existe: $file"
  fi
done

echo ""
echo "📊 Verificando resultados..."
echo "Páginas que aún tienen Sidebar import:"
grep -l "import { Sidebar }" /workspace/app/**/dashboard/page.tsx 2>/dev/null || echo "  ✅ Ninguna!"

echo ""
echo "✅ ¡Proceso completado!"
