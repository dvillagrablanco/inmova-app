import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function IntegracionesPage() {
  return (
    <ComingSoonPage
      title="Integraciones"
      description="Centro de integraciones con servicios externos"
      expectedFeatures={[
        'Catálogo de integraciones disponibles',
        'Configuración de APIs',
        'Webhooks y sincronización',
        'Logs de actividad',
        'Marketplace de apps',
      ]}
    />
  );
}
