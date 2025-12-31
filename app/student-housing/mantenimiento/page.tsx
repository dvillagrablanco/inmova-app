import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingMantenimientoPage() {
  return (
    <ComingSoonPage
      title="Mantenimiento Residencia"
      description="Gestión de mantenimiento e incidencias en residencias estudiantiles"
      expectedFeatures={[
        'Reportes de incidencias por estudiantes',
        'Gestión de órdenes de trabajo',
        'Mantenimiento preventivo programado',
        'Tracking de resolución de incidencias',
        'Valoración del servicio de mantenimiento',
      ]}
    />
  );
}
