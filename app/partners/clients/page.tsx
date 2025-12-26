'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Building, Calendar, Euro, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PartnerClientsPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.company.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.company.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    } else {
      setFilteredClientes(clientes);
    }
  }, [searchTerm, clientes]);

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('partnerToken');
      if (!token) {
        router.push('/partners/login');
        return;
      }

      const response = await fetch('/api/partners/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      setClientes(data.clientes);
      setFilteredClientes(data.clientes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando clientes...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Clientes</h1>
          <p className="text-gray-600">Gestiona y visualiza todos tus clientes activos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clientes.filter((c) => c.estado === 'activo').length}
                  </p>
                </div>
                <Building className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Comisión Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €
                    {clientes
                      .reduce((sum, c) => sum + (c.totalComisionGenerada || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Clientes</CardTitle>
            <CardDescription>Busca por nombre o email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} encontrado
              {filteredClientes.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron clientes' : 'Aún no tienes clientes'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClientes.map((cliente: any) => (
                  <div
                    key={cliente.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {cliente.company.nombre}
                            </h3>
                            {cliente.company.email && (
                              <p className="text-sm text-gray-600">{cliente.company.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="ml-12 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Activado:{' '}
                            {new Date(cliente.fechaActivacion).toLocaleDateString('es-ES')}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Euro className="h-4 w-4 mr-2" />
                            Comisión generada: €
                            {cliente.totalComisionGenerada?.toFixed(2) || '0.00'}
                          </div>
                          {cliente.origenInvitacion && (
                            <div className="text-sm text-gray-600">
                              Origen: <span className="capitalize">{cliente.origenInvitacion}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            cliente.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {cliente.estado === 'activo' ? 'Activo' : cliente.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
