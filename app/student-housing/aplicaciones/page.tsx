import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingAplicacionesPage() {
  return (
    <ComingSoonPage
      title="Aplicaciones Estudiantiles"
      description="Portal de solicitudes y aplicaciones para residencia"
      expectedFeatures={[
        'Formulario de solicitud de residencia',
        'Proceso de admisión automatizado',
        'Verificación de documentos',
        'Sistema de puntuación y priorización',
        'Notificaciones de estado de aplicación',
      ]}
    />
  );
}
