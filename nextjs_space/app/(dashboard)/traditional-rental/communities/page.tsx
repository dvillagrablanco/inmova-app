'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Euro, Wallet, Vote, Plus } from 'lucide-react';

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState('minutes');

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Comunidades
        </h1>
        <p className="text-gray-600">
          Actas digitales, cuotas, fondos de reserva y votaciones telemáticas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="minutes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Actas
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Cuotas
          </TabsTrigger>
          <TabsTrigger value="funds" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Fondos
          </TabsTrigger>
          <TabsTrigger value="votes" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Votaciones
          </TabsTrigger>
        </TabsList>

        {/* ACTAS */}
        <TabsContent value="minutes">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Actas de Junta</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Acta
              </Button>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Junta Ordinaria - Enero 2025</h4>
                      <p className="text-sm text-gray-600">Edificio: Torre Vista Mar</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Asistentes: 12/15 • Acuerdos: 5
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Aprobada
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">Ver Acta</Button>
                    <Button size="sm" variant="outline">Firmar</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* CUOTAS */}
        <TabsContent value="fees">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Cuotas de Comunidad</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generar Cuotas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Mes Actual</p>
                <p className="text-2xl font-bold text-blue-600">€12,500</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Cobradas</p>
                <p className="text-2xl font-bold text-green-600">€9,800</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-red-600">€2,700</p>
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center border-b py-3">
                  <div>
                    <p className="font-medium">Unidad {i}A • Enero 2025</p>
                    <p className="text-sm text-gray-600">Ordinaria • €125.00</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {i > 3 ? (
                      <>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Pendiente
                        </span>
                        <Button size="sm">Marcar Pagado</Button>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Pagado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* FONDOS */}
        <TabsContent value="funds">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Fondos de Reserva</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Fondo
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Fondo de Reparaciones', balance: 15000, goal: 20000, type: 'reparaciones' },
                { name: 'Fondo de Emergencias', balance: 8500, goal: 10000, type: 'emergencias' },
                { name: 'Fondo de Mejoras', balance: 22000, goal: 25000, type: 'mejoras' },
              ].map((fund, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{fund.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{fund.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">€{fund.balance.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Objetivo: €{fund.goal.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(fund.balance / fund.goal) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Añadir Ingreso</Button>
                    <Button size="sm" variant="outline">Registrar Gasto</Button>
                    <Button size="sm" variant="outline">Ver Movimientos</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* VOTACIONES */}
        <TabsContent value="votes">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Votaciones Telemáticas</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Votación
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Aprobación del presupuesto 2025', status: 'activa', votes: 8, total: 15 },
                { title: 'Renovación del ascensor', status: 'activa', votes: 12, total: 15 },
                { title: 'Contratación nueva empresa de limpieza', status: 'cerrada', votes: 15, total: 15 },
              ].map((vote, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{vote.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Participación: {vote.votes}/{vote.total} ({Math.round((vote.votes / vote.total) * 100)}%)
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      vote.status === 'activa' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vote.status === 'activa' ? 'En curso' : 'Cerrada'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(vote.votes / vote.total) * 100}%` }}
                    />
                  </div>
                  <Button size="sm" disabled={vote.status === 'cerrada'}>
                    {vote.status === 'activa' ? 'Emitir Voto' : 'Ver Resultados'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
      </div>
        </main>
      </div>
    </div>
  );
}
