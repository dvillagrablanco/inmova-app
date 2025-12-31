import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function EspaciosCoworkingPage() {
  return (
    <ComingSoonPage
      title="Espacios de Coworking"
      description="Gestión de espacios de coworking y oficinas flexibles"
      expectedFeatures={[
        'Reservas de puestos y salas',
        'Planes de membresía',
        'Control de accesos',
        'Facturación de servicios',
        'Gestión de amenidades',
      ]}
    />
  );
}
