import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoMantenimientoPage() {
  return (
    <ComingSoonPage
      title="Solicitudes de Mantenimiento"
      description="Reporta incidencias y solicita reparaciones"
      expectedFeatures={[
        'Formulario de solicitud con fotos',
        'Categorización automática',
        'Seguimiento en tiempo real',
        'Chat con técnico asignado',
        'Valoración del servicio',
      ]}
    />
  );
}
