import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ReportesOperacionalesPage() {
  return (
    <ComingSoonPage
      title="Reportes Operacionales"
      description="Informes de operaciones y gestión inmobiliaria"
      expectedFeatures={[
        'Tasas de ocupación',
        'Tiempos de respuesta de mantenimiento',
        'Satisfacción de inquilinos',
        'Rendimiento de equipos',
        'KPIs operativos personalizados',
      ]}
    />
  );
}
