import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersRegistroPage() {
  return (
    <ComingSoonPage
      title="Registro de Partners"
      description="Proceso de registro y onboarding para nuevos partners"
      expectedFeatures={[
        'Formulario de solicitud de partner',
        'Verificación de identidad y documentación',
        'Contrato digital y firma electrónica',
        'Onboarding guiado paso a paso',
        'Aprobación automática o manual',
      ]}
    />
  );
}
