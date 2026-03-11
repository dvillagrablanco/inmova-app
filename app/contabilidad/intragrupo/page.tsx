// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowRightLeft,
  Plus,
  Building2,
  Euro,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Company {
  id: string;
  nombre: string;
}

export default function IntragrupoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fromCompanyId: '',
    toCompanyId: '',
    descripcion: '',
    importe: '',
    periodo: format(new Date(), 'yyyy-MM'),
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      loadData();
      loadCompanies();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/billing/intercompany');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setTransactions(data.transactions || []);
      }
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/user/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch {
      /* skip */
    }
  };

  const handleCreate = async () => {
    if (!form.fromCompanyId || !form.toCompanyId || !form.importe) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (form.fromCompanyId === form.toCompanyId) {
      toast.error('Las sociedades emisora y receptora deben ser diferentes');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/billing/intercompany', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCompanyId: form.fromCompanyId,
          toCompanyId: form.toCompanyId,
          conceptos: [
            {
              descripcion: form.descripcion || 'Servicios de gestión',
              cantidad: 1,
              precioUnitario: parseFloat(form.importe),
            },
          ],
          periodo: form.periodo,
          notas: form.notas,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setShowCreate(false);
        setForm({
          fromCompanyId: '',
          toCompanyId: '',
          descripcion: '',
          importe: '',
          periodo: format(new Date(), 'yyyy-MM'),
          notas: '',
        });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error creando factura');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(n);

  const getCompanyName = (id: string) => companies.find((c) => c.id === id)?.nombre || id;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contabilidad">Contabilidad</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Facturación Intragrupo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facturación Intragrupo</h1>
            <p className="text-gray-500">
              Facturas entre sociedades del grupo (Vidaro, Rovida, Viroda)
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Nueva Factura
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Facturas emitidas</div>
              <div className="text-xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Total facturado</div>
              <div className="text-xl font-bold text-indigo-600">
                {fmt(invoices.reduce((s: number, i: any) => s + (i.total || 0), 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Pendientes cobro</div>
              <div className="text-xl font-bold text-orange-600">
                {invoices.filter((i: any) => i.estado === 'PENDIENTE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500">Asientos contables</div>
              <div className="text-xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Facturas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Facturas Intragrupo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left font-medium text-gray-500">Nº Factura</th>
                    <th className="p-3 text-left font-medium text-gray-500">Emisor</th>
                    <th className="p-3 text-left font-medium text-gray-500">Periodo</th>
                    <th className="p-3 text-right font-medium text-gray-500">Total</th>
                    <th className="p-3 text-center font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{inv.numeroFactura}</td>
                      <td className="p-3 text-gray-600">
                        {inv.company?.nombre || getCompanyName(inv.companyId)}
                      </td>
                      <td className="p-3 text-gray-600">{inv.periodo}</td>
                      <td className="p-3 text-right font-medium">{fmt(inv.total)}</td>
                      <td className="p-3 text-center">
                        <Badge
                          className={
                            inv.estado === 'PAGADA'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {inv.estado === 'PAGADA' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {inv.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No hay facturas intragrupo. Crea la primera con el botón superior.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog crear factura */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Factura Intragrupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sociedad Emisora</Label>
                <Select
                  value={form.fromCompanyId}
                  onValueChange={(v) => setForm({ ...form, fromCompanyId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar emisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sociedad Receptora</Label>
                <Select
                  value={form.toCompanyId}
                  onValueChange={(v) => setForm({ ...form, toCompanyId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar receptor" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies
                      .filter((c) => c.id !== form.fromCompanyId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Concepto</Label>
                <Input
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Servicios de gestión administrativa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Importe (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.importe}
                    onChange={(e) => setForm({ ...form, importe: e.target.value })}
                    placeholder="1000.00"
                  />
                </div>
                <div>
                  <Label>Periodo</Label>
                  <Input
                    type="month"
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Input
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Ej: ARC Q1 2026"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Crear Factura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <AIDocumentAssistant />
    </AuthenticatedLayout>
  );
}
