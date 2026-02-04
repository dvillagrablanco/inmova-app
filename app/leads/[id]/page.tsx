"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, ArrowLeft, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface LeadDetail {
  id: string;
  nombre?: string;
  apellidos?: string | null;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  estado?: string | null;
  fuente?: string | null;
  notas?: string | null;
  presupuestoMensual?: number | null;
  createdAt?: string;
}

export default function LeadDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<LeadDetail | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLead();
    }
  }, [status, router, leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/leads/${leadId}`);
      if (!response.ok) throw new Error('Error cargando lead');
      const data = await response.json();
      setLead(data);
    } catch (error) {
      logger.error('Error loading lead:', error);
      toast.error('No se pudo cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const nombreCompleto = `${lead.nombre || ''} ${lead.apellidos || ''}`.trim();

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{nombreCompleto || 'Lead'}</h1>
            <p className="text-muted-foreground">Detalle del lead</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={() => router.push(`/leads/${lead.id}/editar`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {lead.estado && <Badge variant="secondary">{lead.estado}</Badge>}
              {lead.fuente && <Badge variant="outline">{lead.fuente}</Badge>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
              {lead.telefono && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.telefono}</span>
                </div>
              )}
              {lead.empresa && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.empresa}</span>
                </div>
              )}
              {lead.presupuestoMensual !== null && lead.presupuestoMensual !== undefined && (
                <div className="text-sm">
                  Presupuesto mensual:{' '}
                  <span className="font-semibold">
                    €{lead.presupuestoMensual.toLocaleString('es-ES')}
                  </span>
                </div>
              )}
            </div>

            {lead.notas && (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                {lead.notas}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
