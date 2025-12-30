import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PermisosPage() {
  return (
    <ComingSoonPage
      title="Gestión de Permisos"
      description="Control de accesos y permisos por rol"
      expectedFeatures={[
        'Roles y permisos personalizables',
        'Control de acceso granular',
        'Auditoría de permisos',
        'Permisos por módulo',
        'Herencia de roles',
      ]}
    />
  );
}
