import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViajesCorporativosDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard Corporativo"
      description="Panel de control para gestión de viajes empresariales"
      expectedFeatures={[
        "Métricas de ocupación corporativa",
        "Gastos por centro de coste",
        "Cumplimiento de políticas",
        "Satisfacción de empleados",
        "Ahorros negociados"
      ]}
    />
  );
}
