import { Metadata } from 'next';
import { MaintenanceDataTable } from '@/components/maintenance/MaintenanceDataTable';

export const metadata: Metadata = {
  title: 'Mantenimiento | Inmova',
  description: 'Gestión de incidencias y mantenimiento',
};

export default function MaintenancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
        <p className="text-gray-600 mt-2">
          Gestiona las incidencias, reparaciones y mantenimiento preventivo
        </p>
      </div>

      <MaintenanceDataTable />
    </div>
  );
}
