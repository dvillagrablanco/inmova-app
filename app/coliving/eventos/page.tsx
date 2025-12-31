import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ColivingEventosPage() {
  return (
    <ComingSoonPage
      title="Eventos y Actividades"
      description="Organización y gestión de eventos para la comunidad de coliving"
      expectedFeatures={[
        'Calendario de eventos de la comunidad',
        'Creación y gestión de eventos',
        'Sistema de inscripciones y confirmaciones',
        'Notificaciones automáticas de eventos',
        'Galería de fotos de eventos pasados',
      ]}
    />
  );
}
