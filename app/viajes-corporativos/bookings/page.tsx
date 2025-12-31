import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViajesCorporativosBookingsPage() {
  return (
    <ComingSoonPage
      title="Reservas Corporativas"
      description="Gestión de reservas para viajes de empresa"
      expectedFeatures={[
        "Sistema de reservas multi-huésped",
        "Aprobaciones workflow",
        "Check-in corporativo",
        "Servicios adicionales",
        "Historial de reservas"
      ]}
    />
  );
}
