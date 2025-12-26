import { Metadata } from 'next';
import { DocumentSearch } from '@/components/documents/DocumentSearch';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = {
  title: 'Búsqueda de Documentos | INMOVA',
  description: 'Busca y encuentra documentos rápidamente',
};

export default function DocumentSearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Búsqueda de Documentos"
        description="Encuentra contratos, documentos y archivos rápidamente"
      />
      <DocumentSearch />
    </div>
  );
}
