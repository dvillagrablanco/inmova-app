import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersComisionesPage() {
  return (
    <ComingSoonPage
      title="Comisiones de Partners"
      description="Gestión y seguimiento de comisiones para partners y afiliados"
      expectedFeatures={[
        'Dashboard de comisiones ganadas',
        'Estructura de comisiones por nivel',
        'Historial de transacciones',
        'Pagos automáticos mensuales',
        'Reportes de rendimiento',
      ]}
    />
  );
}
