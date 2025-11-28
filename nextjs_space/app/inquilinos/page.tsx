'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Users, Plus, Mail, Phone, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function InquilinosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchTenants();
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session) return null;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'bajo': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'alto': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inquilinos</h1>
              <p className="text-gray-600 mt-1">Gestiona todos los inquilinos</p>
            </div>
            <button
              onClick={() => router.push('/inquilinos/nuevo')}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Plus size={20} />
              Nuevo Inquilino
            </button>
          </div>

          {/* Tenants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <Link
                key={tenant?.id}
                href={`/inquilinos/${tenant?.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(tenant?.nivelRiesgo)}`}>
                    {tenant?.nivelRiesgo}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tenant?.nombreCompleto}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span className="truncate">{tenant?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{tenant?.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>DNI: {tenant?.dni}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Scoring</p>
                    <p className="text-lg font-bold text-gray-900">{tenant?.scoring}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unidades</p>
                    <p className="text-lg font-bold text-gray-900">{tenant?.units?.length || 0}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {tenants.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay inquilinos registrados</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}