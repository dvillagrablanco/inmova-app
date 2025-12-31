import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function TareasPage() {
  return (
    <ComingSoonPage
      title="Gestión de Tareas"
      description="Sistema avanzado de gestión de tareas y proyectos"
      expectedFeatures={[
        'Lista de tareas con priorización',
        'Asignación de responsables',
        'Fechas de vencimiento',
        'Seguimiento de progreso',
        'Notificaciones automáticas',
      ]}
    />
  );
}
