import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function InspeccionDigitalPage() {
  return (
    <ComingSoonPage
      title="Inspección Digital"
      description="Sistema de inspecciones digitales de propiedades"
      expectedFeatures={[
        'Checklist de inspección personalizable',
        'Fotos y videos con geolocalización',
        'Firma digital de inspecciones',
        'Comparativa entrada/salida',
        'Informes automáticos',
      ]}
    />
  );
}
