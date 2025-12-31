import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersMarketingPage() {
  return (
    <ComingSoonPage
      title="Marketing para Partners"
      description="Herramientas y campañas de marketing para partners"
      expectedFeatures={[
        'Campañas de marketing co-branded',
        'Generador de links de afiliado',
        'Tracking de campañas y conversiones',
        'Plantillas de email marketing',
        'Landing pages personalizadas',
      ]}
    />
  );
}
