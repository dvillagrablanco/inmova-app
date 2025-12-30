import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function FinanzasPage() {
  return (
    <ComingSoonPage
      title="Finanzas"
      description="Centro de control financiero completo"
      expectedFeatures={[
        'Estado de cuentas en tiempo real',
        'Presupuestos y previsiones',
        'Análisis de rentabilidad',
        'Conciliación bancaria',
        'Gestión de tesorería',
      ]}
    />
  );
}
