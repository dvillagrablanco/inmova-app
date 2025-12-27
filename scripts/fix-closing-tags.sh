#!/bin/bash

# Script para corregir el orden incorrecto de cierre de AuthenticatedLayout

echo "🔧 Corrigiendo tags de cierre de AuthenticatedLayout..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

fixed=0

# Lista de archivos a corregir
files=(
  "app/cupones/page.tsx"
  "app/documentos/page.tsx"
  "app/edificios/page.tsx"
  "app/flipping/dashboard/page.tsx"
  "app/inquilinos/page.tsx"
  "app/mantenimiento/page.tsx"
  "app/room-rental/page.tsx"
  "app/soporte/page.tsx"
  "app/tareas/page.tsx"
  "app/open-banking/page.tsx"
  "app/str/dashboard/page.tsx"
  "app/visitas/page.tsx"
  "app/seguros/page.tsx"
  "app/home-mobile/page.tsx"
  "app/onboarding/page.tsx"
  "app/publicaciones/page.tsx"
  "app/reservas/page.tsx"
  "app/str-housekeeping/staff/page.tsx"
  "app/str-housekeeping/page.tsx"
)

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ⚠️  $file - No existe"
    continue
  fi
  
  # Buscar el patrón incorrecto: );  </AuthenticatedLayout>
  # Y reemplazarlo por: </AuthenticatedLayout>  );
  
  if grep -q $');[[:space:]]*$.*</AuthenticatedLayout>' "$file" 2>/dev/null || \
     grep -q $'</div>[[:space:]]*$.*);[[:space:]]*$.*</AuthenticatedLayout>' "$file" 2>/dev/null; then
    
    # Usar sed para corregir
    sed -i 's|);[[:space:]]*$\(.*\)</AuthenticatedLayout>|</AuthenticatedLayout>\n);|g' "$file"
    
    echo "  ✅ $file"
    ((fixed++))
  else
    echo "  ℹ  $file - Sin cambios"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Archivos corregidos: $fixed"
echo "═══════════════════════════════════════════════════════════════"
echo ""
