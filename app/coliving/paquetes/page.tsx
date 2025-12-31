import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ColivingPaquetesPage() {
  return (
    <ComingSoonPage
      title="Paquetes y Servicios"
      description="Gestión de paquetes de servicios y amenidades para espacios de coliving"
      expectedFeatures={[
        'Catálogo de paquetes de servicios',
        'Servicios de limpieza y lavandería',
        'Amenidades premium (gym, coworking, etc.)',
        'Gestión de suscripciones mensuales',
        'Facturación automática de servicios adicionales',
      ]}
    />
  );
}
