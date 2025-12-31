import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ComunidadPage() {
  return (
    <ComingSoonPage
      title="Gestión de Comunidad"
      description="Administra tu comunidad de propietarios de forma eficiente con votaciones, gastos comunes y convocatorias."
      expectedFeatures={[
        'Votaciones en línea con resultados en tiempo real',
        'Gestión de gastos comunes y derramas',
        'Calendario de convocatorias y asambleas',
        'Comunicaciones a propietarios',
        'Registro de acuerdos y actas',
        'Control de deudores',
      ]}
    />
  );
}
