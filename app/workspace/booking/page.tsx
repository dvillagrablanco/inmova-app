import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WorkspaceBookingPage() {
  return (
    <ComingSoonPage
      title="Reservas Workspace"
      description="Sistema de reservas para espacios de trabajo"
      expectedFeatures={[
        "Reserva de puestos y salas",
        "Calendario de disponibilidad",
        "Servicios adicionales",
        "Check-in digital",
        "Historial de reservas"
      ]}
    />
  );
}
