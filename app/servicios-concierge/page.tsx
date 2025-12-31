import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ServiciosConciergePage() {
  return (
    <ComingSoonPage
      title="Servicios de Concierge"
      description="Servicios premium y atención personalizada"
      expectedFeatures={[
        'Solicitud de servicios premium',
        'Gestión de peticiones',
        'Proveedores verificados',
        'Historial de servicios',
        'Facturación de concierge',
      ]}
    />
  );
}
