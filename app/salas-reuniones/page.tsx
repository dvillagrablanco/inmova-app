import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function SalasReunionesPage() {
  return (
    <ComingSoonPage
      title="Salas de Reuniones"
      description="Reserva y gestión de salas de reuniones"
      expectedFeatures={[
        'Calendario de reservas',
        'Equipamiento y capacidad',
        'Check-in digital',
        'Facturación por uso',
        'Servicios adicionales (catering, etc.)',
      ]}
    />
  );
}
