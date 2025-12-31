import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PagosPlanesPage() {
  return (
    <ComingSoonPage
      title="Planes de Pago"
      description="Gestión de planes de pago y suscripciones"
      expectedFeatures={[
        'Catálogo de planes disponibles',
        'Configuración de planes personalizados',
        'Pagos fraccionados',
        'Gestión de suscripciones',
        'Upgrades y downgrades',
      ]}
    />
  );
}
