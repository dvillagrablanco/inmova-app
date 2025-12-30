import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesAgentesPage() {
  return (
    <ComingSoonPage
      title="Gestión de Agentes"
      description="Administración de agentes de la red"
      expectedFeatures={[
        'Directorio completo de agentes',
        'Perfiles y certificaciones',
        'Historial de transacciones',
        'Evaluaciones de desempeño',
        'Asignación de leads y zonas',
      ]}
    />
  );
}
