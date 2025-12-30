import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ReportesFinancierosPage() {
  return (
    <ComingSoonPage
      title="Reportes Financieros"
      description="Informes y análisis financieros detallados"
      expectedFeatures={[
        'Estado de resultados (P&L)',
        'Flujo de caja (Cash Flow)',
        'Balance general',
        'Análisis de rentabilidad por propiedad',
        'Reportes fiscales y contables',
      ]}
    />
  );
}
