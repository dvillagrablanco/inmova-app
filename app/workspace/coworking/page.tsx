import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WorkspaceCoworkingPage() {
  return (
    <ComingSoonPage
      title="Coworking"
      description="Gestión de espacios de coworking"
      expectedFeatures={[
        "Gestión de coworkers",
        "Planes de membresía",
        "Facturación flexible",
        "Eventos y networking",
        "Servicios complementarios"
      ]}
    />
  );
}
