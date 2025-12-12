export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { FileText, ArrowLeft, Calendar, DollarSign, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import SubscriptionManager from './components/SubscriptionManager';
import logger, { logError } from '@/lib/logger';


export default function ContratoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setContract(data);
        }
      } catch (error) {
        logger.error('Error fetching contract:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && params?.id) {
      fetchContract();
    }
  }, [status, params]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || !contract) return null;

  const diasHastaVencimiento = Math.ceil(
    (new Date(contract?.fechaFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/contratos')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Contratos
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      Contrato #{contract?.id?.slice(0, 8) || 'Detalle'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-black text-white rounded-lg">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Contrato - {contract?.unit?.building?.nombre}
                    </h1>
                    <p className="text-gray-600 mt-1">Unidad {contract?.unit?.numero}</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium">
                  {contract?.estado}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Inquilino</p>
                  <p className="text-lg font-bold text-gray-900">
                    {contract?.tenant?.nombreCompleto}
                  </p>
                  <p className="text-sm text-gray-600">{contract?.tenant?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <Calendar size={16} />
                    Período del contrato
                  </p>
                  <p className="text-gray-900 font-medium">
                    {new Date(contract?.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                    {new Date(contract?.fechaFin).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {diasHastaVencimiento > 0
                      ? `${diasHastaVencimiento} días restantes`
                      : 'Vencido'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tipo</p>
                  <p className="text-gray-900 font-medium">{contract?.tipo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <DollarSign size={16} />
                    Renta Mensual
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{contract?.rentaMensual?.toLocaleString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Depósito/Fianza</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{contract?.deposito?.toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            </div>

            {contract?.payments && contract.payments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Pagos</h2>
                <div className="space-y-3">
                  {contract.payments.slice(0, 12).map((payment: any) => (
                    <div
                      key={payment?.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{payment?.periodo}</p>
                        <p className="text-sm text-gray-600">
                          Vencimiento:{' '}
                          {new Date(payment?.fechaVencimiento).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          €{payment?.monto?.toLocaleString('es-ES')}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                            payment?.estado === 'pagado'
                              ? 'bg-green-100 text-green-800'
                              : payment?.estado === 'pendiente'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment?.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription Manager */}
            <SubscriptionManager
              contractId={contract.id}
              subscription={contract.stripeSubscription}
              rentaMensual={contract.rentaMensual}
              onUpdate={() => {
                // Refresh contract data
                fetch(`/api/contracts/${params?.id}`)
                  .then((res) => res.json())
                  .then((data) => setContract(data))
                  .catch((err) => logger.error('Error refreshing contract:', err));
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
