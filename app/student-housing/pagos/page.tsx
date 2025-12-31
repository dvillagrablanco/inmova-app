import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function StudentHousingPagosPage() {
  return (
    <ComingSoonPage
      title="Pagos Estudiantiles"
      description="Sistema de pagos y facturación para estudiantes"
      expectedFeatures={[
        'Planes de pago mensuales y semestrales',
        'Becas y descuentos estudiantiles',
        'Pagos fraccionados y financiación',
        'Recordatorios automáticos de pago',
        'Integración con sistemas universitarios',
      ]}
    />
  );
}
