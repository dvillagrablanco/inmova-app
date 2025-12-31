import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViviendaSocialPage() {
  return (
    <ComingSoonPage
      title="Vivienda Social"
      description="Gestión de vivienda protegida y programas sociales"
      expectedFeatures={[
        "Gestión de VPO y VPT",
        "Solicitudes y listas de espera",
        "Verificación de requisitos",
        "Reporting a administración",
        "Seguimiento de beneficiarios"
      ]}
    />
  );
}
