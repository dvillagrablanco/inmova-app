import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard de Agentes"
      description="Panel de control para agentes inmobiliarios"
      expectedFeatures={[
        'Métricas de rendimiento individual',
        'Leads asignados y pipeline',
        'Comisiones y objetivos',
        'Ranking de agentes',
        'Actividades recientes',
      ]}
    />
  );
}
