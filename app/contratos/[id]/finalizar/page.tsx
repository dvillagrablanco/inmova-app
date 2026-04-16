'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, FileText, Calculator, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  estado: string;
  unit?: { numero: string; building?: { nombre: string } };
  tenant?: { nombreCompleto: string };
  payments?: Array<{
    id: string;
    monto: number;
    estado: string;
    fechaVencimiento: string;
  }>;
}

export default function FinalizarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [desperfectos, setDesperfectos] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !contractId) return;
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}`);
        if (!res.ok) throw new Error('Contrato no encontrado');
        const data = await res.json();
        setContract(data);
      } catch {
        toast.error('Error al cargar contrato');
        router.push('/contratos');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [status, contractId, router]);

  const pendientes = (contract?.payments ?? []).filter((p) => p.estado !== 'pagado');
  const deudaPendiente = pendientes.reduce((s, p) => s + Number(p.monto ?? 0), 0);
  const fianza = Number(contract?.deposito ?? 0) || Number(contract?.rentaMensual ?? 0);
  const devolucionFianza = Math.max(0, fianza - deudaPendiente - desperfectos);

  const handleFinalizar = async () => {
    if (!contract) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'vencido' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al finalizar');
      }
      toast.success('Contrato finalizado correctamente');
      router.push('/contratos');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al finalizar');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!contract || !session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Finalizar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-bold">Finalizar contrato</h1>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1 ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > s ? 'bg-primary text-primary-foreground' : step === s ? 'bg-primary/20' : 'bg-muted'
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <ArrowRight className="h-4 w-4" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Revisión
              </CardTitle>
              <CardDescription>Resumen del contrato y pagos pendientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Inquilino</p>
                <p className="font-medium">{contract.tenant?.nombreCompleto || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unidad</p>
                <p className="font-medium">
                  {contract.unit?.building?.nombre || ''} - {contract.unit?.numero || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodo</p>
                <p className="font-medium">
                  {(() => {
                    const fmt = (iso: string | null | undefined) => {
                      try {
                        if (!iso) return '—';
                        const d = new Date(iso);
                        if (isNaN(d.getTime())) return '—';
                        return format(d, 'dd MMM yyyy', { locale: es });
                      } catch {
                        return '—';
                      }
                    };
                    return `${fmt(contract.fechaInicio)} - ${fmt(contract.fechaFin)}`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fianza</p>
                <p className="font-medium">€{fianza.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos pendientes</p>
                <p className="font-medium">
                  €{deudaPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ({pendientes.length}{' '}
                  {pendientes.length === 1 ? 'pago' : 'pagos'})
                </p>
              </div>
              <Button onClick={() => setStep(2)}>Siguiente: Liquidación</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Liquidación
              </CardTitle>
              <CardDescription>Cálculo de devolución de fianza</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Deuda pendiente</p>
                <p className="font-medium">€{deudaPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desperfectos">Desperfectos (€)</Label>
                <Input
                  id="desperfectos"
                  type="number"
                  min={0}
                  step={0.01}
                  value={desperfectos || ''}
                  onChange={(e) => setDesperfectos(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Devolución fianza</p>
                <p className="text-xl font-bold text-green-600">
                  €{devolucionFianza.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fianza €{fianza.toLocaleString('es-ES')} - Deuda €{deudaPendiente.toLocaleString('es-ES')} -
                  Desperfectos €{desperfectos.toLocaleString('es-ES')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button onClick={() => setStep(3)}>Siguiente: Finalizar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Finalizar
              </CardTitle>
              <CardDescription>
                Confirmar finalización. El contrato pasará a estado finalizado y la unidad quedará disponible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm">
                  <strong>Devolución al inquilino:</strong> €
                  {devolucionFianza.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                  Atrás
                </Button>
                <Button onClick={handleFinalizar} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    'Confirmar y finalizar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
