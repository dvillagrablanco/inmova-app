import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoContratoPage() {
  return (
    <ComingSoonPage
      title="Mi Contrato"
      description="Visualización y gestión del contrato de arrendamiento"
      expectedFeatures={[
        'Visualización de contrato actual',
        'Descarga de contrato en PDF',
        'Historial de renovaciones',
        'Solicitud de modificaciones',
        'Renovación automática',
      ]}
    />
  );
}
