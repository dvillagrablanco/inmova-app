import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function LicitacionesPage() {
  return (
    <ComingSoonPage
      title="Licitaciones"
      description="Gestión de licitaciones y procesos de contratación"
      expectedFeatures={[
        'Creación de licitaciones',
        'Recepción de ofertas',
        'Comparativa de propuestas',
        'Sistema de puntuación',
        'Adjudicación y contratos',
      ]}
    />
  );
}
