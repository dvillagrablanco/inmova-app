import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoChatbotPage() {
  return (
    <ComingSoonPage
      title="Asistente Virtual IA"
      description="Chatbot inteligente para inquilinos disponible 24/7"
      expectedFeatures={[
        'Respuestas instantáneas a preguntas frecuentes',
        'Ayuda con pagos y facturas',
        'Solicitud de mantenimiento guiada',
        'Consulta de contrato',
        'Escalado a soporte humano cuando necesario',
      ]}
    />
  );
}
