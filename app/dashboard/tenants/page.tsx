import { Metadata } from 'next';
import { TenantsDataTable } from '@/components/tenants/TenantsDataTable';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export const metadata: Metadata = {
  title: 'Inquilinos | Inmova',
  description: 'Gestión de inquilinos y arrendatarios',
};

export default function TenantsPage() {
  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inquilinos</h1>
          <p className="text-gray-600 mt-2">
            Administra la información de tus inquilinos y sus contratos
          </p>
        </div>

        <TenantsDataTable />
      </div>
    </AuthenticatedLayout>
  );
}
