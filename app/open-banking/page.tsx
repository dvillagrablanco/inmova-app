import { Metadata } from 'next';
import { Building2, CreditCard, TrendingUp, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Open Banking | Inmova',
  description: 'Integración bancaria avanzada',
};

export default function OpenBankingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏦 Open Banking</h1>
        <p className="text-gray-600 mt-2">
          Conexión directa con bancos para automatizar pagos y conciliaciones
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏦</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Open Banking Integration
          </h2>
          <p className="text-gray-600 mb-6">
            Este módulo está en desarrollo. Próximamente disponible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="border rounded-lg p-4">
              <Building2 className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-2">Conexión Bancaria</h3>
              <p className="text-sm text-gray-600">Conecta tus cuentas bancarias</p>
            </div>
            <div className="border rounded-lg p-4">
              <CreditCard className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-2">Pagos Automáticos</h3>
              <p className="text-sm text-gray-600">Domiciliaciones SEPA</p>
            </div>
            <div className="border rounded-lg p-4">
              <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold mb-2">Conciliación</h3>
              <p className="text-sm text-gray-600">Concilia pagos automáticamente</p>
            </div>
            <div className="border rounded-lg p-4">
              <Shield className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold mb-2">Seguridad PSD2</h3>
              <p className="text-sm text-gray-600">Conexión segura regulada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
