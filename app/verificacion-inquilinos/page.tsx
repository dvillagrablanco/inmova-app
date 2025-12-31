import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function VerificacionInquilinosPage() {
  return (
    <ComingSoonPage
      title="Verificación de Inquilinos"
      description="Sistema de screening y verificación de inquilinos"
      expectedFeatures={[
        'Verificación de identidad',
        'Historial crediticio',
        'Referencias laborales',
        'Antecedentes penales',
        'Scoring automático',
      ]}
    />
  );
}
