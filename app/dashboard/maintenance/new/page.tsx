import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import NewItemPlaceholder from '@/components/ui/new-item-placeholder';

export default function NewMaintenancePage() {
  return (
    <AuthenticatedLayout>
      <NewItemPlaceholder title="Crear Solicitud de Mantenimiento" />
    </AuthenticatedLayout>
  );
}