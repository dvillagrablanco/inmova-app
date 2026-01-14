import { Metadata } from 'next';
import { PropertiesDataTable } from '@/components/properties/PropertiesDataTable';

export const metadata: Metadata = {
  title: 'Propiedades | Inmova',
  description: 'Gestión de propiedades inmobiliarias',
};

export default function PropertiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Propiedades</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu cartera de propiedades inmobiliarias
        </p>
      </div>

      <PropertiesDataTable />
    </div>
  );
}
