import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesRegistroPage() {
  return (
    <ComingSoonPage
      title="Registro de Agentes"
      description="Proceso de alta y onboarding de nuevos agentes"
      expectedFeatures={[
        'Formulario de solicitud de agente',
        'Verificación de licencias y documentos',
        'Onboarding automatizado',
        'Firma de contratos digitales',
        'Aprobación y activación',
      ]}
    />
  );
}
