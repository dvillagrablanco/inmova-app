import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViviendaSocialApplicationsPage() {
  return (
    <ComingSoonPage
      title="Solicitudes - Vivienda Social"
      description="Gestión de solicitudes de vivienda protegida"
      expectedFeatures={[
        "Formulario de solicitud online",
        "Validación de documentación",
        "Sistema de puntuación",
        "Listas de espera priorizadas",
        "Notificaciones de estado"
      ]}
    />
  );
}
