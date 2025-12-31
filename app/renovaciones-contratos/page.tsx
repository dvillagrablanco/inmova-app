import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RenovacionesContratosPage() {
  return (
    <ComingSoonPage
      title="Renovaciones de Contratos"
      description="Gestión de renovaciones y prórrogas contractuales"
      expectedFeatures={[
        "Alertas de vencimientos",
        "Propuestas automáticas de renovación",
        "Negociación de condiciones",
        "Actualización de rentas (IPC)",
        "Firma digital de renovaciones"
      ]}
    />
  );
}
