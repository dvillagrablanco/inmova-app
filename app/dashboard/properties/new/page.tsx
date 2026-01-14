import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import NewItemPlaceholder from '@/components/ui/new-item-placeholder';

export default function NewPropertyPage() {
  return (
    <AuthenticatedLayout>
      <NewItemPlaceholder title="Crear Nueva Propiedad" />
    </AuthenticatedLayout>
  );
}