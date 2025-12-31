import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViajesCorporativosPage() {
  return (
    <ComingSoonPage
      title="Viajes Corporativos"
      description="Gestión de alojamientos para empresas y viajes de negocio"
      expectedFeatures={[
        "Reservas corporativas",
        "Gestión de políticas de viaje",
        "Centro de costes",
        "Facturación centralizada",
        "Reportes de gastos"
      ]}
    />
  );
}
