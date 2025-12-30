import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PartnersCapacitacionPage() {
  return (
    <ComingSoonPage
      title="Capacitación de Partners"
      description="Programa de formación y certificación para partners"
      expectedFeatures={[
        'Cursos y módulos de formación',
        'Certificaciones de partner',
        'Webinars y sesiones en vivo',
        'Evaluaciones y tests de conocimiento',
        'Seguimiento de progreso de formación',
      ]}
    />
  );
}
