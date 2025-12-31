import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WorkspacePage() {
  return (
    <ComingSoonPage
      title="Espacios de Trabajo"
      description="Gestión de espacios de coworking y oficinas flexibles"
      expectedFeatures={[
        "Gestión de espacios compartidos",
        "Reservas de salas y puestos",
        "Membresías y planes",
        "Control de accesos",
        "Comunidad de coworkers"
      ]}
    />
  );
}
