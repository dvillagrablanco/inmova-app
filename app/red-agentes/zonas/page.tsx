import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesZonasPage() {
  return (
    <ComingSoonPage
      title="Gestión de Zonas"
      description="Administración de zonas geográficas y territorios"
      expectedFeatures={[
        'Mapa de zonas y territorios',
        'Asignación de agentes por zona',
        'Exclusividad de zonas',
        'Rendimiento por zona geográfica',
        'Redistribución de territorios',
      ]}
    />
  );
}
