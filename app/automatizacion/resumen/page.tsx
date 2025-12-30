import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function AutomatizacionResumenPage() {
  return (
    <ComingSoonPage
      title="Resumen de Automatizaciones"
      description="Dashboard con métricas y estadísticas de todas las automatizaciones activas"
      expectedFeatures={[
        'Resumen visual de automatizaciones activas',
        'Métricas de ahorro de tiempo y eficiencia',
        'Historial de ejecuciones',
        'Alertas de automatizaciones fallidas',
        'Recomendaciones de optimización',
      ]}
    />
  );
}
