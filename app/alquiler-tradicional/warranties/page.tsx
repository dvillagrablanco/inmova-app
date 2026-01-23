'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Warranty {
  id: string;
  tenantName: string;
  propertyName: string;
  amount: number;
  type: 'cash' | 'bank_guarantee' | 'insurance';
  depositDate: string;
  status: 'active' | 'pending_return' | 'returned' | 'deducted';
  contractEndDate: string;
  deductions: Array<{
    amount: number;
    reason: string;
    date: string;
  }>;
}

export default function WarrantiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState<Warranty[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadWarranties();
    }
  }, [status]);

  const loadWarranties = async () => {
    try {
      setLoading(true);
      
      setWarranties([
        {
          id: 'w1',
          tenantName: 'María García',
          propertyName: 'Piso C/ Mayor 45, 3ºA',
          amount: 1200,
          type: 'cash',
          depositDate: '2024-01-15',
          status: 'active',
          contractEndDate: '2026-01-15',
          deductions: [],
        },
        {
          id: 'w2',
          tenantName: 'Juan Martínez',
          propertyName: 'Apartamento Playa, Bloque 2',
          amount: 1500,
          type: 'bank_guarantee',
          depositDate: '2023-06-01',
          status: 'active',
          contractEndDate: '2025-06-01',
          deductions: [],
        },
        {
          id: 'w3',
          tenantName: 'Ana Rodríguez',
          propertyName: 'Estudio Centro, 1ºB',
          amount: 900,
          type: 'insurance',
          depositDate: '2024-09-01',
          status: 'pending_return',
          contractEndDate: '2025-09-01',
          deductions: [
            {
              amount: 150,
              reason: 'Reparación pared dañada',
              date: '2025-12-20',
            },
          ],
        },
      ]);

    } catch (error) {
      toast.error('Error al cargar garantías');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-500', label: 'Activa', icon: CheckCircle },
      pending_return: { color: 'bg-yellow-500', label: 'Pendiente Devolución', icon: Clock },
      returned: { color: 'bg-blue-500', label: 'Devuelta', icon: CheckCircle },
      deducted: { color: 'bg-red-500', label: 'Deducida', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.active;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      cash: { label: 'Efectivo', color: 'bg-blue-500' },
      bank_guarantee: { label: 'Aval Bancario', color: 'bg-purple-500' },
      insurance: { label: 'Seguro', color: 'bg-green-500' },
    };
    const { label, color } = config[type as keyof typeof config] || config.cash;
    return <Badge className={color}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalActive = warranties.filter(w => w.status === 'active').reduce((sum, w) => sum + w.amount, 0);
  const pendingReturn = warranties.filter(w => w.status === 'pending_return').length;

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando garantías...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Garantías</h1>
                <p className="text-muted-foreground mt-2">
                  Control de fianzas y devoluciones
                </p>
              </div>
              <Button onClick={() => router.push('/alquiler-tradicional/warranties/nueva')}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Garantía
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Garantías</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{warranties.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Importe Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalActive)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">En garantías activas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pendientes Devolución</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingReturn}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren procesamiento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Garantías Activas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {warranties.filter(w => w.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Contratos vigentes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {warranties.map((warranty) => (
                <Card key={warranty.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{warranty.tenantName}</CardTitle>
                          <CardDescription>{warranty.propertyName}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(warranty.status)}
                        {getTypeBadge(warranty.type)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Importe Inicial</p>
                        <p className="text-lg font-bold">{formatCurrency(warranty.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha Depósito</p>
                        <p className="text-sm font-medium">{formatDate(warranty.depositDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fin Contrato</p>
                        <p className="text-sm font-medium">{formatDate(warranty.contractEndDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Importe a Devolver</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            warranty.amount - warranty.deductions.reduce((sum, d) => sum + d.amount, 0)
                          )}
                        </p>
                      </div>
                    </div>

                    {warranty.deductions.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Deducciones:</p>
                        <div className="space-y-2">
                          {warranty.deductions.map((deduction, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                              <div>
                                <p className="text-sm font-medium">{deduction.reason}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(deduction.date)}</p>
                              </div>
                              <p className="text-sm font-bold text-red-600">
                                -{formatCurrency(deduction.amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Documentos
                      </Button>
                      {warranty.status === 'pending_return' && (
                        <Button size="sm" className="flex-1">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Procesar Devolución
                        </Button>
                      )}
                      {warranty.status === 'active' && (
                        <Button size="sm" variant="outline" className="flex-1">
                          Añadir Deducción
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

      {/* Asistente IA de Documentos - Para subir recibos de fianza, avales, etc. */}
      <AIDocumentAssistant 
        context="documentos"
        variant="floating"
        position="bottom-right"
        onAnalysisComplete={(analysis, file) => {
          toast.success(`Documento "${file.name}" analizado correctamente`);
        }}
      />
        </AuthenticatedLayout>
  );
}
