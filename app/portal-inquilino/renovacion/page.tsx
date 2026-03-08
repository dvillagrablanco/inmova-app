'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Calendar, Euro, TrendingUp, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantRenovacionPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    // TODO: get tenantId from session
    fetch('/api/portal-inquilino/renovacion?tenantId=placeholder')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  const handleDecision = async (dec: 'aceptar' | 'rechazar') => {
    if (!data?.contract?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal-inquilino/renovacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: data.contract.id, decision: dec, comentario }),
      });
      const result = await res.json();
      if (res.ok) { setDecision(dec); toast.success(result.message); }
      else toast.error(result.error);
    } catch { toast.error('Error'); }
    finally { setSubmitting(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  if (!data || data.estado === 'no_requiere_accion') {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Card><CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No hay renovaciones pendientes</h3>
          <p className="text-gray-500">Tu contrato no requiere acción en este momento.</p>
        </CardContent></Card>
      </div>
    );
  }

  if (decision) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Card className={decision === 'aceptar' ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}>
          <CardContent className="py-12 text-center">
            {decision === 'aceptar' ? <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" /> : <XCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />}
            <h3 className="text-xl font-bold">{decision === 'aceptar' ? '¡Renovación aceptada!' : 'Renovación rechazada'}</h3>
            <p className="text-gray-600 mt-2">{decision === 'aceptar' ? 'Tu contrato ha sido renovado.' : 'Hemos notificado al administrador.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Renovación de Contrato</h1>
        <p className="text-gray-500">Revisa la propuesta y decide</p>
      </div>

      {/* Contrato actual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Tu contrato actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{data.contract.edificio} — {data.contract.unidad}</p>
          <p className="text-sm text-gray-500">{data.contract.direccion}</p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div><span className="text-xs text-gray-500">Renta actual</span><p className="font-bold text-lg">{fmt(data.contract.rentaActual)}/mes</p></div>
            <div><span className="text-xs text-gray-500">Vencimiento</span><p className="font-bold">{new Date(data.contract.fechaFin).toLocaleDateString('es-ES')}</p></div>
          </div>
          <Badge variant={data.contract.diasParaVencimiento <= 30 ? 'destructive' : 'outline'}>
            <Calendar className="h-3 w-3 mr-1" /> {data.contract.diasParaVencimiento} días para vencimiento
          </Badge>
        </CardContent>
      </Card>

      {/* Propuesta */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600" /> Propuesta de renovación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Nueva renta</span>
            <span className="text-xl font-bold text-blue-600">{fmt(data.propuesta.nuevaRenta)}/mes</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Incremento IPC ({data.propuesta.incremento}%)</span>
            <span className="text-amber-600">+{fmt(data.propuesta.incrementoEuros)}/mes</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duración</span>
            <span>{data.propuesta.duracion}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Nueva fecha fin</span>
            <span>{new Date(data.propuesta.nuevaFechaFin).toLocaleDateString('es-ES')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Comentario */}
      <div>
        <Textarea placeholder="Comentario opcional..." rows={2} value={comentario} onChange={e => setComentario(e.target.value)} />
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDecision('rechazar')} disabled={submitting}>
          <XCircle className="h-4 w-4 mr-2" /> Rechazar
        </Button>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('aceptar')} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Aceptar renovación
        </Button>
      </div>
    </div>
  );
}
