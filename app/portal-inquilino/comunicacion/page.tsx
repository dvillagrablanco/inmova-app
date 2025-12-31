import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoComunicacionPage() {
  return (
    <ComingSoonPage
      title="Comunicación con Propietario"
      description="Sistema de mensajería entre inquilino y propietario"
      expectedFeatures={[
        'Chat en tiempo real',
        'Historial de conversaciones',
        'Adjuntar archivos y fotos',
        'Notificaciones push',
        'Plantillas de mensajes frecuentes',
      ]}
    />
  );
}
