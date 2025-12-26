'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function RenewalsPage() {
  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Renovaciones Inteligentes</h1>
            <p className="text-gray-600 mb-8">
              Análisis predictivo con IA, cálculo automático de IPC y propuestas personalizadas
            </p>

            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <p className="text-sm text-gray-600">Contratos a vencer</p>
                <p className="text-3xl font-bold text-blue-600">8</p>
                <p className="text-xs text-gray-500 mt-1">Próximos 90-180 días</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600">Probabilidad Media</p>
                <p className="text-3xl font-bold text-green-600">72%</p>
                <p className="text-xs text-gray-500 mt-1">De renovación</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600">IPC Actual</p>
                <p className="text-3xl font-bold text-purple-600">3.5%</p>
                <p className="text-xs text-gray-500 mt-1">Aplicable 2025</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600">Tasa de Éxito</p>
                <p className="text-3xl font-bold text-orange-600">85%</p>
                <p className="text-xs text-gray-500 mt-1">Histórico</p>
              </Card>
            </div>

            {/* Análisis Predictivo */}
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Análisis Predictivo de Renovaciones</h3>
                <Button>Generar Recomendaciones</Button>
              </div>
              <div className="space-y-4">
                {[
                  {
                    unit: '3A - Torre Vista Mar',
                    tenant: 'María García',
                    probability: 85,
                    recommendation: 'renovar',
                    rent: 950,
                    newRent: 983,
                    factors: [
                      { name: 'Puntualidad pagos', impact: '+15' },
                      { name: 'Antigüedad 3 años', impact: '+10' },
                      { name: 'Sin incidencias', impact: '+10' },
                    ],
                  },
                  {
                    unit: '5B - Edificio Sol',
                    tenant: 'Juan Pérez',
                    probability: 62,
                    recommendation: 'negociar',
                    rent: 850,
                    newRent: 880,
                    factors: [
                      { name: 'Pagos puntuales', impact: '+15' },
                      { name: 'Renta sobre mercado', impact: '-12' },
                      { name: '2 incidencias', impact: '-5' },
                    ],
                  },
                  {
                    unit: '2C - Residencial Plaza',
                    tenant: 'Ana Rodríguez',
                    probability: 35,
                    recommendation: 'no_renovar',
                    rent: 1100,
                    newRent: 1138,
                    factors: [
                      { name: 'Morosidad', impact: '-10' },
                      { name: 'Renta muy alta', impact: '-12' },
                      { name: 'Múltiples incidencias', impact: '-8' },
                    ],
                  },
                ].map((contract, i) => (
                  <div key={i} className="border rounded-lg p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{contract.unit}</h4>
                        <p className="text-gray-600">Inquilino: {contract.tenant}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Probabilidad</p>
                          <p
                            className={`text-2xl font-bold ${
                              contract.probability >= 70
                                ? 'text-green-600'
                                : contract.probability >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {contract.probability}%
                          </p>
                        </div>
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            contract.recommendation === 'renovar'
                              ? 'bg-green-100'
                              : contract.recommendation === 'negociar'
                                ? 'bg-yellow-100'
                                : 'bg-red-100'
                          }`}
                        >
                          {contract.recommendation === 'renovar' ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : contract.recommendation === 'negociar' ? (
                            <Clock className="h-8 w-8 text-yellow-600" />
                          ) : (
                            <AlertCircle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Factores de Análisis */}
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <p className="text-sm font-medium mb-2">Factores de Análisis:</p>
                      <div className="flex flex-wrap gap-2">
                        {contract.factors.map((factor, j) => (
                          <span
                            key={j}
                            className={`px-2 py-1 rounded text-xs ${
                              factor.impact.startsWith('+')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {factor.name}: {factor.impact}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Propuesta de Renta */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Renta Actual</p>
                        <p className="text-lg font-semibold">€{contract.rent}/mes</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Renta Propuesta (IPC 3.5%)</p>
                        <p className="text-lg font-semibold text-green-600">
                          €{contract.newRent}/mes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Incremento</p>
                        <p className="text-lg font-semibold">€{contract.newRent - contract.rent}</p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={contract.recommendation === 'renovar' ? 'default' : 'outline'}
                      >
                        Generar Propuesta
                      </Button>
                      <Button size="sm" variant="outline">
                        Ver Historial
                      </Button>
                      <Button size="sm" variant="outline">
                        Análisis Completo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Propuestas Enviadas */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Propuestas Enviadas</h3>
              <div className="space-y-3">
                {[
                  { unit: '1A', status: 'aceptada', date: '2025-01-10' },
                  { unit: '4C', status: 'pendiente', date: '2025-01-05' },
                  { unit: '6B', status: 'rechazada', date: '2024-12-28' },
                ].map((proposal, i) => (
                  <div key={i} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-medium">Unidad {proposal.unit}</p>
                      <p className="text-sm text-gray-600">Enviada: {proposal.date}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        proposal.status === 'aceptada'
                          ? 'bg-green-100 text-green-800'
                          : proposal.status === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {proposal.status === 'aceptada'
                        ? 'Aceptada'
                        : proposal.status === 'pendiente'
                          ? 'Pendiente respuesta'
                          : 'Rechazada'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
