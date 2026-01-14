import { Metadata } from 'next';
import { PaymentsDataTable } from '@/components/payments/PaymentsDataTable';

export const metadata: Metadata = {
  title: 'Pagos | Inmova',
  description: 'Gestión de cobros y pagos de alquiler',
};

export default function PaymentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los cobros de alquileres, recibos y estado de cuentas
        </p>
      </div>

      <PaymentsDataTable />
    </div>
  );
}
