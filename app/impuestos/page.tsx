import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ImpuestosPage() {
  return (
    <ComingSoonPage
      title="Gestión de Impuestos"
      description="Gestión fiscal y declaraciones de impuestos"
      expectedFeatures={[
        'Cálculo automático de impuestos',
        'Declaraciones trimestrales',
        'Modelo 100, 347, y otros',
        'Deducciones y optimización fiscal',
        'Integración con asesor fiscal',
      ]}
    />
  );
}
