import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ServiciosLimpiezaPage() {
  return (
    <ComingSoonPage
      title="Servicios de Limpieza"
      description="Gestión de servicios de limpieza y mantenimiento"
      expectedFeatures={[
        'Programación de limpiezas',
        'Asignación de personal',
        'Checklist de tareas',
        'Control de calidad',
        'Facturación de servicios',
      ]}
    />
  );
}
