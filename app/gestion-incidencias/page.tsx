import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function GestionIncidenciasPage() {
  return (
    <ComingSoonPage
      title="Gestión de Incidencias"
      description="Sistema avanzado de gestión de incidencias y tickets"
      expectedFeatures={[
        'Sistema de tickets con priorización',
        'Asignación automática a técnicos',
        'SLA y tiempos de respuesta',
        'Base de conocimientos',
        'Estadísticas de resolución',
      ]}
    />
  );
}
