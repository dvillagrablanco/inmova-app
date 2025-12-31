import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PlanesPage() {
  return (
    <ComingSoonPage
      title="Planes y Suscripciones"
      description="Gestión de planes de suscripción de la plataforma"
      expectedFeatures={[
        'Comparativa de planes',
        'Upgrade de plan actual',
        'Facturación y pagos',
        'Historial de suscripciones',
        'Personalización de plan',
      ]}
    />
  );
}
