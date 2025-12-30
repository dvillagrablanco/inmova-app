import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingActividadesPage() {
  return (
    <ComingSoonPage
      title="Actividades Estudiantiles"
      description="Gestión de actividades y eventos para estudiantes"
      expectedFeatures={[
        'Calendario de actividades académicas y sociales',
        'Clubs y grupos estudiantiles',
        'Talleres y sesiones de estudio',
        'Eventos deportivos y culturales',
        'Sistema de inscripciones',
      ]}
    />
  );
}
