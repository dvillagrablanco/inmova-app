import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function VisitasPage() {
  return (
    <ComingSoonPage
      title="Gestión de Visitas"
      description="Coordinación de visitas a propiedades"
      expectedFeatures={[
        'Agenda de visitas',
        'Confirmaciones automáticas',
        'Recordatorios por email/SMS',
        'Feedback post-visita',
        'Tracking de conversión',
      ]}
    />
  );
}
