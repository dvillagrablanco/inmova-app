import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingPage() {
  return (
    <ComingSoonPage
      title="Student Housing"
      description="Plataforma completa de gestión para residencias estudiantiles"
      expectedFeatures={[
        'Gestión de habitaciones y contratos estudiantiles',
        'Portal de estudiantes con servicios integrados',
        'Calendario académico y eventos',
        'Servicios de estudio y biblioteca',
        'Integración con universidades',
      ]}
    />
  );
}
