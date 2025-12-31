import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WorkspaceDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard Workspace"
      description="Panel de control para espacios de trabajo"
      expectedFeatures={[
        "Ocupación en tiempo real",
        "Ingresos por espacio",
        "Satisfacción de miembros",
        "Tasa de renovación",
        "Métricas de comunidad"
      ]}
    />
  );
}
