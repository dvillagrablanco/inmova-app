import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingHabitacionesPage() {
  return (
    <ComingSoonPage
      title="Habitaciones Estudiantiles"
      description="Gestión de habitaciones y asignaciones para estudiantes"
      expectedFeatures={[
        'Catálogo de habitaciones disponibles',
        'Asignación inteligente de habitaciones',
        'Compatibilidad entre compañeros',
        'Gestión de mobiliario y equipamiento',
        'Inspecciones de entrada y salida',
      ]}
    />
  );
}
