import { Metadata } from 'next';
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = {
  title: 'Dashboard de Propietarios | INMOVA',
  description: 'Vista completa de tus propiedades, ingresos y ocupación'
};

export default function OwnerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard de Propietarios"
        description="Vista completa de tus propiedades, métricas financieras y alertas importantes"
      />
      <OwnerDashboard />
    </div>
  );
}
