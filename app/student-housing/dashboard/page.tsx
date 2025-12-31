import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard Student Housing"
      description="Panel de control para gestión de residencias estudiantiles"
      expectedFeatures={[
        'Vista general de ocupación y disponibilidad',
        'Métricas de rendimiento académico',
        'Alertas de mantenimiento y incidencias',
        'Estadísticas de pagos y morosidad',
        'Calendario de eventos y actividades',
      ]}
    />
  );
}
