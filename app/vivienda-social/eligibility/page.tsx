import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViviendaSocialEligibilityPage() {
  return (
    <ComingSoonPage
      title="Elegibilidad"
      description="Verificación de requisitos para vivienda protegida"
      expectedFeatures={[
        "Calculadora de elegibilidad",
        "Verificación de ingresos",
        "Comprobación de patrimonio",
        "Validación de empadronamiento",
        "Certificados digitales"
      ]}
    />
  );
}
