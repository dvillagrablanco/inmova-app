import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PresupuestosPage() {
  return (
    <ComingSoonPage
      title="Presupuestos"
      description="Creación y gestión de presupuestos"
      expectedFeatures={[
        'Generador de presupuestos',
        'Plantillas personalizables',
        'Seguimiento de aprobaciones',
        'Conversión a factura',
        'Análisis de desviaciones',
      ]}
    />
  );
}
