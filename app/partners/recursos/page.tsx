import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersRecursosPage() {
  return (
    <ComingSoonPage
      title="Recursos para Partners"
      description="Biblioteca de recursos, materiales y herramientas para partners"
      expectedFeatures={[
        'Materiales de marketing descargables',
        'Guías y documentación',
        'Assets de branding (logos, banners)',
        'Plantillas de presentación',
        'Videos de formación',
      ]}
    />
  );
}
