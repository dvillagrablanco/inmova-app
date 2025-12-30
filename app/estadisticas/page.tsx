import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function EstadisticasPage() {
  return (
    <ComingSoonPage
      title="Estadísticas Avanzadas"
      description="Panel de estadísticas y métricas del negocio"
      expectedFeatures={[
        'Dashboards interactivos',
        'Gráficos y visualizaciones avanzadas',
        'Comparativas históricas',
        'Proyecciones y forecasting',
        'Exportación de datos',
      ]}
    />
  );
}
