import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RealEstateDeveloperDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard Promotor"
      description="Panel de control para promotores inmobiliarios"
      expectedFeatures={[
        "Métricas de proyectos activos",
        "Estado de comercialización",
        "Indicadores financieros",
        "Timeline de entregas",
        "Alertas de hitos críticos"
      ]}
    />
  );
}
