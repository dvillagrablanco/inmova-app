import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RedAgentesFormacionPage() {
  return (
    <ComingSoonPage
      title="Formación de Agentes"
      description="Programa de capacitación y desarrollo para agentes"
      expectedFeatures={[
        'Academia virtual de formación',
        'Cursos y certificaciones',
        'Materiales de estudio',
        'Exámenes y evaluaciones',
        'Seguimiento de progreso',
      ]}
    />
  );
}
