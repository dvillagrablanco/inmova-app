import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function InstalacionesDeportivasPage() {
  return (
    <ComingSoonPage
      title="Instalaciones Deportivas"
      description="Gestión de espacios deportivos y reservas"
      expectedFeatures={[
        'Reserva de pistas y espacios',
        'Calendario de disponibilidad',
        'Gestión de mantenimiento',
        'Control de accesos',
        'Facturación de uso',
      ]}
    />
  );
}
