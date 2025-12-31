import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WorkspaceMembersPage() {
  return (
    <ComingSoonPage
      title="Miembros Workspace"
      description="Gestión de miembros de coworking"
      expectedFeatures={[
        "Directorio de miembros",
        "Perfiles profesionales",
        "Networking y matchmaking",
        "Programa de fidelización",
        "Comunicación de comunidad"
      ]}
    />
  );
}
