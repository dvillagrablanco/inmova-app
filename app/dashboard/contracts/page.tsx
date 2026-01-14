import { Metadata } from 'next';
import { ContractsDataTable } from '@/components/contracts/ContractsDataTable';

export const metadata: Metadata = {
  title: 'Contratos | Inmova',
  description: 'Gestión de contratos de alquiler',
};

export default function ContractsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        <p className="text-gray-600 mt-2">
          Visualiza y gestiona los contratos de alquiler activos e históricos
        </p>
      </div>

      <ContractsDataTable />
    </div>
  );
}
