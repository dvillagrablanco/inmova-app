import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViviendaSocialDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard Vivienda Social"
      description="Panel de control para programas de vivienda social"
      expectedFeatures={[
        "Indicadores sociales",
        "Ocupación de VPO",
        "Solicitudes pendientes",
        "Impacto social",
        "Cumplimiento normativo"
      ]}
    />
  );
}
