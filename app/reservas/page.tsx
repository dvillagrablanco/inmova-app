import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ReservasPage() {
  return (
    <ComingSoonPage
      title="Sistema de Reservas"
      description="Gestión de reservas de espacios y servicios"
      expectedFeatures={[
        'Calendario de disponibilidad',
        'Reservas online',
        'Confirmaciones automáticas',
        'Gestión de cancelaciones',
        'Reportes de ocupación',
      ]}
    />
  );
}
