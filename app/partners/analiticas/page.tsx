import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersAnaliticasPage() {
  return (
    <ComingSoonPage
      title="Analíticas de Partners"
      description="Dashboard completo de métricas y rendimiento de partners"
      expectedFeatures={[
        'Métricas de conversión de referidos',
        'Análisis de rendimiento por canal',
        'Comparativas entre períodos',
        'Embudo de ventas y conversión',
        'Exportación de reportes personalizados',
      ]}
    />
  );
}
