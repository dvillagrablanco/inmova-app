import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoIncidenciasPage() {
  return (
    <ComingSoonPage
      title="Mis Incidencias"
      description="Gestión de incidencias y solicitudes de mantenimiento"
      expectedFeatures={[
        'Crear nuevas incidencias con fotos',
        'Seguimiento en tiempo real',
        'Historial de incidencias',
        'Valoración del servicio',
        'Chat con técnico asignado',
      ]}
    />
  );
}
