import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import NewItemPlaceholder from '@/components/ui/new-item-placeholder';

export default function NewPaymentPage() {
  return (
    <AuthenticatedLayout>
      <NewItemPlaceholder title="Registrar Nuevo Pago" />
    </AuthenticatedLayout>
  );
}