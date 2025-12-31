import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function WarrantyManagementPage() {
  return (
    <ComingSoonPage
      title="Gestión de Garantías"
      description="Sistema integral de gestión de garantías y avales inmobiliarios"
      expectedFeatures={[
        'Registro y seguimiento de garantías',
        'Gestión de avales bancarios',
        'Alertas de vencimiento',
        'Renovaciones automáticas',
        'Documentación digitalizada',
        'Reportes de garantías activas',
      ]}
    />
  );
}
