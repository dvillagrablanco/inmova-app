import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesComisionesPage() {
  return (
    <ComingSoonPage
      title="Comisiones de Agentes"
      description="Sistema de comisiones y pagos para agentes"
      expectedFeatures={[
        'Estructura de comisiones personalizable',
        'Cálculo automático de comisiones',
        'Splits entre agentes',
        'Historial de pagos',
        'Informes fiscales',
      ]}
    />
  );
}
