import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PortalInquilinoPage() {
  return (
    <ComingSoonPage
      title="Portal del Inquilino"
      description="Portal de autoservicio para inquilinos"
      expectedFeatures={[
        'Acceso a información de contrato y pagos',
        'Solicitud de mantenimiento',
        'Comunicación con propietario',
        'Documentos y facturas',
        'Renovación de contrato online',
      ]}
    />
  );
}
