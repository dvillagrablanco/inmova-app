import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function SuscripcionesPage() {
  return (
    <ComingSoonPage
      title="Gestión de Suscripciones"
      description="Administración de suscripciones y facturación recurrente"
      expectedFeatures={[
        'Panel de suscripciones activas',
        'Gestión de renovaciones',
        'Cambios de plan',
        'Facturación automática',
        'Análisis de churn',
      ]}
    />
  );
}
