'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function TreasuryPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Tesorería Avanzada</h1>
      <p className="text-gray-600 mb-8">Cash flow, fianzas, provisiones y alertas financieras</p>

      {/* Cash Flow Forecast */}
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Previsión de Cash Flow (6 meses)</h3>
        <div className="grid grid-cols-6 gap-3">
          {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((mes, i) => {
            const value = [5200, 4800, -1200, 3500, 6100, 4900][i];
            return (
              <div key={mes} className={`p-3 rounded-lg text-center ${value < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-600">{mes}</p>
                <p className={`text-lg font-bold ${value < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  €{value.toLocaleString()}
                </p>
                {value < 0 ? <TrendingDown className="h-4 w-4 mx-auto text-red-600 mt-1" /> : <TrendingUp className="h-4 w-4 mx-auto text-green-600 mt-1" />}
              </div>
            );
          })}
        </div>
        <Button className="mt-4">Generar Nueva Previsión</Button>
      </Card>

      {/* Depósitos y Provisiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fianzas Gestionadas</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-3">
                <div className="flex justify-between">
                  <span className="font-medium">Contrato #{i}234</span>
                  <span className="text-green-600 font-semibold">€1,500</span>
                </div>
                <p className="text-sm text-gray-600">Estado: Depositado</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Provisiones de Impagos</h3>
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">Total Provisión</p>
            <p className="text-2xl font-bold text-red-600">€2,340</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bajo riesgo (0-30 días)</span>
              <span className="font-medium">€340</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Medio riesgo (30-60 días)</span>
              <span className="font-medium">€800</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Alto riesgo (más de 60 días)</span>
              <span className="font-medium">€1,200</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas Financieras */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alertas Financieras Activas</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Cash flow negativo en Marzo</p>
              <p className="text-sm text-gray-600">Déficit proyectado: €1,200</p>
            </div>
            <Button size="sm" variant="outline">Revisar</Button>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">5 pagos vencidos de más de 30 días</p>
              <p className="text-sm text-gray-600">Total: €1,850</p>
            </div>
            <Button size="sm" variant="outline">Ver</Button>
          </div>
        </div>
      </Card>
    </div>
      </div>
        </main>
      </div>
    </div>
  );
}
