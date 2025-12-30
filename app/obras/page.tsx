import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ObrasPage() {
  return (
    <ComingSoonPage
      title="Gestión de Obras"
      description="Coordinación y seguimiento de obras y reformas"
      expectedFeatures={[
        'Planificación de obras',
        'Presupuestos y contratistas',
        'Seguimiento de avance',
        'Control de costes',
        'Certificaciones y entregas',
      ]}
    />
  );
}
