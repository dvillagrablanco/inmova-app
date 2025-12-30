import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ProyectosRenovacionPage() {
  return (
    <ComingSoonPage
      title="Proyectos de Renovación"
      description="Gestión de proyectos de renovación y reforma"
      expectedFeatures={[
        'Planificación de proyectos',
        'Presupuestos y ROI estimado',
        'Seguimiento de obras',
        'Before/After con fotos',
        'Valoración post-renovación',
      ]}
    />
  );
}
