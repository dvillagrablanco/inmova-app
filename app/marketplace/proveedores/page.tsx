import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function MarketplaceProveedoresPage() {
  return (
    <ComingSoonPage
      title="Proveedores de Servicios"
      description="Directorio de proveedores verificados"
      expectedFeatures={[
        'Catálogo de proveedores por categoría',
        'Perfiles verificados con certificaciones',
        'Valoraciones y reseñas',
        'Comparativa de precios',
        'Solicitud de presupuestos',
      ]}
    />
  );
}
