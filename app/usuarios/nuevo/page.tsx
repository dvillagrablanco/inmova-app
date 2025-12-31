import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function UsuariosNuevoPage() {
  return (
    <ComingSoonPage
      title="Nuevo Usuario"
      description="Crear nuevo usuario del sistema"
      expectedFeatures={[
        "Formulario de registro",
        "Asignación de roles y permisos",
        "Configuración de accesos",
        "Invitación por email",
        "Onboarding personalizado"
      ]}
    />
  );
}
