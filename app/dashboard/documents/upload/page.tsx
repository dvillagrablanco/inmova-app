import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import NewItemPlaceholder from '@/components/ui/new-item-placeholder';

export default function UploadDocumentPage() {
  return (
    <AuthenticatedLayout>
      <NewItemPlaceholder title="Subir Nuevo Documento" />
    </AuthenticatedLayout>
  );
}