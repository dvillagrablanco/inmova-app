import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersIntegracionesPage() {
  return (
    <ComingSoonPage
      title="Integraciones para Partners"
      description="Herramientas y APIs para integración de partners"
      expectedFeatures={[
        'API de partners para integraciones',
        'Webhooks y notificaciones en tiempo real',
        'SDKs y librerías de integración',
        'Documentación técnica de API',
        'Sandbox para pruebas de integración',
      ]}
    />
  );
}
