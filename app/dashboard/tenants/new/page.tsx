import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import NewItemPlaceholder from '@/components/ui/new-item-placeholder';

export default function NewTenantPage() {
  return (
    <AuthenticatedLayout>
      <NewItemPlaceholder title="Registrar Nuevo Inquilino" />
    </AuthenticatedLayout>
  );
}