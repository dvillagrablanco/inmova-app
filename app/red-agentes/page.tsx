import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesPage() {
  return (
    <ComingSoonPage
      title="Red de Agentes"
      description="Plataforma para gestión de red de agentes inmobiliarios"
      expectedFeatures={[
        'Gestión de agentes y equipos',
        'Sistema de comisiones multinivel',
        'Formación y certificaciones',
        'Herramientas de prospección',
        'CRM especializado para agentes',
      ]}
    />
  );
}
