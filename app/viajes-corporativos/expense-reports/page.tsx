import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViajesCorporativosExpenseReportsPage() {
  return (
    <ComingSoonPage
      title="Informes de Gastos"
      description="Reportes de gastos en viajes corporativos"
      expectedFeatures={[
        "Consolidación de gastos",
        "Exportación contable",
        "Análisis por departamento",
        "Comparativas de presupuesto",
        "Alertas de desviaciones"
      ]}
    />
  );
}
