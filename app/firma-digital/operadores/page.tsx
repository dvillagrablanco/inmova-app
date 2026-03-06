'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home, ArrowLeft, FileSignature, Plus, CheckCircle, XCircle, Clock,
  Send, Search, Filter, Eye, Building2, Users, RefreshCw, Upload,
  AlertTriangle, FileText, Loader2, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface OperatorRequest {
  id: string;
  operatorName: string;
  operatorEmail?: string;
  operatorRef?: string;
  documentName: string;
  documentUrl: string;
  status: string;
  tenantName?: string;
  tenantEmail?: string;
  monthlyRent?: number;
  startDate?: string;
  endDate?: string;
  contractType?: string;
  signatories: any[];
  unit?: { numero: string; building: { nombre: string; ciudad?: string } };
  signatureProvider?: string;
  signatureExternalId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectedReason?: string;
  createdAt: string;
  receivedVia: string;
}

interface Stats {
  total: number;
  pendingReview: number;
  sentToSign: number;
  signed: number;
  rejected: number;
  expired: number;
  byOperator: Array<{ operator: string; count: number; signed: number; pending: number }>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending_review: { label: 'Pendiente', variant: 'secondary', icon: Clock },
  approved: { label: 'Aprobado', variant: 'outline', icon: CheckCircle },
  sent_to_sign: { label: 'Enviado a firma', variant: 'default', icon: Send },
  signed: { label: 'Firmado', variant: 'default', icon: CheckCircle },
  rejected: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
  expired: { label: 'Expirado', variant: 'destructive', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', variant: 'outline', icon: XCircle },
};

export default function OperatorSignaturesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [requests, setRequests] = useState<OperatorRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOperator, setFilterOperator] = useState('all');
  const [search, setSearch] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OperatorRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // New request form
  const [newForm, setNewForm] = useState({
    operatorName: '',
    documentUrl: '',
    documentName: '',
    unitId: '',
    tenantName: '',
    tenantEmail: '',
    monthlyRent: '',
    signatoryName: '',
    signatoryEmail: '',
    signatoryRole: 'LANDLORD',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterOperator !== 'all') params.set('operator', filterOperator);

      const [reqRes, statsRes] = await Promise.all([
        fetch(`/api/operator-signatures?${params}`),
        fetch('/api/operator-signatures/stats'),
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.data || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterOperator]);

  useEffect(() => {
    if (authStatus === 'authenticated') loadData();
  }, [authStatus, loadData]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/operator-signatures/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success('Contrato aprobado y enviado a DocuSign');
        loadData();
        setShowDetailDialog(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al aprobar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/operator-signatures/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        toast.success('Solicitud rechazada');
        loadData();
        setShowRejectDialog(false);
        setShowDetailDialog(false);
        setRejectReason('');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al rechazar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreate = async () => {
    if (!newForm.operatorName || !newForm.documentUrl || !newForm.signatoryEmail) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/operator-signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: newForm.operatorName,
          documentUrl: newForm.documentUrl,
          documentName: newForm.documentName || `contrato-${newForm.operatorName}.pdf`,
          unitId: newForm.unitId || undefined,
          tenantName: newForm.tenantName || undefined,
          tenantEmail: newForm.tenantEmail || undefined,
          monthlyRent: newForm.monthlyRent ? parseFloat(newForm.monthlyRent) : undefined,
          signatories: [
            { name: newForm.signatoryName || 'Representante', email: newForm.signatoryEmail, role: newForm.signatoryRole },
          ],
          receivedVia: 'manual',
        }),
      });
      if (res.ok) {
        toast.success('Solicitud creada');
        setShowNewDialog(false);
        setNewForm({ operatorName: '', documentUrl: '', documentName: '', unitId: '', tenantName: '', tenantEmail: '', monthlyRent: '', signatoryName: '', signatoryEmail: '', signatoryRole: 'LANDLORD' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, variant: 'outline' as const, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return r.operatorName.toLowerCase().includes(q) ||
        r.documentName.toLowerCase().includes(q) ||
        r.tenantName?.toLowerCase().includes(q) ||
        r.unit?.building?.nombre?.toLowerCase().includes(q);
    }
    return true;
  });

  const uniqueOperators = [...new Set(requests.map(r => r.operatorName))];

  if (authStatus === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/firma-digital')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Firma Digital
              </Button>
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/firma-digital">Firma Digital</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Operadores</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="mt-2 text-2xl font-bold">Contratos de Operadores</h1>
            <p className="text-muted-foreground">Gestiona los contratos recibidos de operadores de media estancia</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Solicitud
          </Button>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-orange-600">{stats.pendingReview}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">En Firma</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">{stats.sentToSign}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Firmados</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{stats.signed}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rechazados</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600">{stats.rejected}</div></CardContent>
            </Card>
          </div>
        )}

        {/* Por operador */}
        {stats && stats.byOperator.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Por Operador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {stats.byOperator.map(op => (
                  <div key={op.operator} className="flex items-center gap-3 p-3 border rounded-lg min-w-[200px]">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{op.operator}</p>
                      <p className="text-xs text-muted-foreground">
                        {op.count} total · {op.signed} firmados · {op.pending} pendientes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending_review">Pendiente</SelectItem>
                  <SelectItem value="sent_to_sign">En firma</SelectItem>
                  <SelectItem value="signed">Firmado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterOperator} onValueChange={setFilterOperator}>
                <SelectTrigger className="w-[180px]"><Building2 className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los operadores</SelectItem>
                  {uniqueOperators.map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileSignature className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No hay solicitudes de firma de operadores</p>
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4" /> Crear primera solicitud
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Inmueble</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{req.operatorName}</p>
                          {req.operatorRef && <p className="text-xs text-muted-foreground">Ref: {req.operatorRef}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">{req.documentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {req.unit ? (
                          <span className="text-sm">{req.unit.building.nombre} - {req.unit.numero}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.tenantName ? (
                          <div>
                            <p className="text-sm">{req.tenantName}</p>
                            {req.monthlyRent && <p className="text-xs text-muted-foreground">{req.monthlyRent}€/mes</p>}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setShowDetailDialog(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {req.status === 'pending_review' && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(req.id)} disabled={processing}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setSelectedRequest(req); setShowRejectDialog(true); }}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                {selectedRequest?.operatorName} — {selectedRequest?.documentName}
              </DialogTitle>
              <DialogDescription>Detalle de la solicitud de firma</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedRequest.status)}
                  <Badge variant="secondary">{selectedRequest.receivedVia}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Operador:</strong> {selectedRequest.operatorName}</div>
                  <div><strong>Referencia:</strong> {selectedRequest.operatorRef || '—'}</div>
                  <div><strong>Inquilino:</strong> {selectedRequest.tenantName || '—'}</div>
                  <div><strong>Email:</strong> {selectedRequest.tenantEmail || '—'}</div>
                  <div><strong>Renta:</strong> {selectedRequest.monthlyRent ? `${selectedRequest.monthlyRent}€/mes` : '—'}</div>
                  <div><strong>Inmueble:</strong> {selectedRequest.unit ? `${selectedRequest.unit.building.nombre} - ${selectedRequest.unit.numero}` : '—'}</div>
                </div>

                {selectedRequest.signatories?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Firmantes</h4>
                    {(selectedRequest.signatories as any[]).map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded mb-1">
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email} — {s.role}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{s.status || 'pendiente'}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRequest.signatureExternalId && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <strong>DocuSign Envelope:</strong> {selectedRequest.signatureExternalId}
                  </div>
                )}

                {selectedRequest.rejectedReason && (
                  <div className="p-3 bg-red-50 rounded-lg text-sm">
                    <strong>Motivo rechazo:</strong> {selectedRequest.rejectedReason}
                  </div>
                )}

                {selectedRequest.status === 'pending_review' && (
                  <DialogFooter className="gap-2">
                    <Button variant="destructive" onClick={() => { setShowRejectDialog(true); }} disabled={processing}>
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                    </Button>
                    <Button onClick={() => handleApprove(selectedRequest.id)} disabled={processing}>
                      {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Aprobar y Enviar a DocuSign
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar solicitud</DialogTitle>
              <DialogDescription>Indica el motivo del rechazo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Motivo</Label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explica el motivo del rechazo..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || processing}>
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Rechazar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Request Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Operador</DialogTitle>
              <DialogDescription>Registra un contrato recibido de un operador de media estancia</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label>Operador *</Label>
                <Select value={newForm.operatorName} onValueChange={(v) => setNewForm(f => ({ ...f, operatorName: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona operador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Álamo">Álamo</SelectItem>
                    <SelectItem value="Spotahome">Spotahome</SelectItem>
                    <SelectItem value="HousingAnywhere">HousingAnywhere</SelectItem>
                    <SelectItem value="Uniplaces">Uniplaces</SelectItem>
                    <SelectItem value="Badi">Badi</SelectItem>
                    <SelectItem value="Homelike">Homelike</SelectItem>
                    <SelectItem value="Beroomers">Beroomers</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL del documento PDF *</Label>
                <Input value={newForm.documentUrl} onChange={(e) => setNewForm(f => ({ ...f, documentUrl: e.target.value }))} placeholder="https://... o ruta S3" />
              </div>
              <div>
                <Label>Nombre del documento</Label>
                <Input value={newForm.documentName} onChange={(e) => setNewForm(f => ({ ...f, documentName: e.target.value }))} placeholder="contrato-alamo-2026.pdf" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre inquilino</Label>
                  <Input value={newForm.tenantName} onChange={(e) => setNewForm(f => ({ ...f, tenantName: e.target.value }))} />
                </div>
                <div>
                  <Label>Email inquilino</Label>
                  <Input type="email" value={newForm.tenantEmail} onChange={(e) => setNewForm(f => ({ ...f, tenantEmail: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Renta mensual (€)</Label>
                <Input type="number" value={newForm.monthlyRent} onChange={(e) => setNewForm(f => ({ ...f, monthlyRent: e.target.value }))} />
              </div>
              <div className="border-t pt-4">
                <Label className="font-medium">Firmante principal *</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input value={newForm.signatoryName} onChange={(e) => setNewForm(f => ({ ...f, signatoryName: e.target.value }))} placeholder="Nombre del firmante" />
                  </div>
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" value={newForm.signatoryEmail} onChange={(e) => setNewForm(f => ({ ...f, signatoryEmail: e.target.value }))} placeholder="email@ejemplo.com" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Crear Solicitud
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
