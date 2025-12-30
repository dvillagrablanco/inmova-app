import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersSoportePage() {
  return (
    <ComingSoonPage
      title="Soporte para Partners"
      description="Centro de ayuda y soporte dedicado para partners"
      expectedFeatures={[
        'Sistema de tickets de soporte',
        'Base de conocimientos y FAQs',
        'Chat en vivo con equipo de partners',
        'Historial de tickets y resoluciones',
        'Feedback y valoración del soporte',
      ]}
    />
  );
}
