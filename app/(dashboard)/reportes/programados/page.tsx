import { Metadata } from 'next';
import { ReportsScheduler } from '@/components/reports/ReportsScheduler';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = {
  title: 'Reportes Programados | INMOVA',
  description: 'Configura reportes automáticos y programados',
};

export default function ScheduledReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes Programados"
        description="Configura la generación y envío automático de reportes"
      />
      <ReportsScheduler />
    </div>
  );
}
