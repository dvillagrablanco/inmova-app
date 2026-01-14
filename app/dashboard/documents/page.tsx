import { Metadata } from 'next';
import { DocumentsDataTable } from '@/components/documents/DocumentsDataTable';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export const metadata: Metadata = {
  title: 'Documentos | Inmova',
  description: 'Gestión documental y archivos',
};

export default function DocumentsPage() {
  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600 mt-2">
            Repositorio centralizado de documentos, contratos y facturas
          </p>
        </div>

        <DocumentsDataTable />
      </div>
    </AuthenticatedLayout>
  );
}
