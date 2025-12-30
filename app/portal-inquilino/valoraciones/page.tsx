import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoValoracionesPage() {
  return (
    <ComingSoonPage
      title="Valoraciones y Feedback"
      description="Comparte tu experiencia y valora el servicio"
      expectedFeatures={[
        'Valoración de la propiedad',
        'Valoración del servicio de gestión',
        'Comentarios y sugerencias',
        'Historial de valoraciones',
        'Respuestas del propietario/gestor',
      ]}
    />
  );
}
