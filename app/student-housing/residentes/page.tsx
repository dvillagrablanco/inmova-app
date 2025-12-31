import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingResidentesPage() {
  return (
    <ComingSoonPage
      title="Residentes Estudiantiles"
      description="Gestión de estudiantes residentes y sus datos"
      expectedFeatures={[
        'Base de datos de estudiantes',
        'Perfiles académicos y personales',
        'Historial de residencia',
        'Documentación y verificaciones',
        'Comunicación con estudiantes',
      ]}
    />
  );
}
