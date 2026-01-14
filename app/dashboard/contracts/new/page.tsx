import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import NewItemPlaceholder from '@/components/ui/new-item-placeholder';

export default function NewContractPage() {
  return (
    <AuthenticatedLayout>
      <NewItemPlaceholder title="Crear Nuevo Contrato" />
    </AuthenticatedLayout>
  );
}