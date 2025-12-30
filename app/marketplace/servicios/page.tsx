import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function MarketplaceServiciosPage() {
  return (
    <ComingSoonPage
      title="Servicios Disponibles"
      description="Catálogo de servicios para propiedades"
      expectedFeatures={[
        'Limpieza y mantenimiento',
        'Reparaciones y reformas',
        'Servicios de mudanza',
        'Seguros y certificaciones',
        'Gestión de compras',
      ]}
    />
  );
}
