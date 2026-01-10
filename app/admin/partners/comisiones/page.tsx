'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Euro,
  Building2,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Commission {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  clientCompanyId: string;
  clientCompanyName: string;
  planName: string;
  planPrice: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  paidAt?: string;
}

interface CommissionStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  totalThisMonth: number;
  partnersActive: number;
  avgCommissionRate: number;
}

export default function PartnerComisionesPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/partners/commissions');
      
      if (!response.ok) {
        throw new Error('Error al cargar comisiones');
      }
      
      const data = await response.json();
      
      setStats(data.stats || {
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        totalThisMonth: 0,
        partnersActive: 0,
        avgCommissionRate: 0,
      });

      setCommissions(data.commissions || []);
    } catch (error) {
      console.error('Error loading commissions:', error);
      toast.error('Error al cargar comisiones');
      setCommissions([]);
      setStats({
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        totalThisMonth: 0,
        partnersActive: 0,
        avgCommissionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/admin/partners/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al aprobar');
      }

      toast.success('Comisión aprobada');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar comisión');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const response = await fetch('/api/admin/partners/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'pay' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al marcar como pagada');
      }

      toast.success('Comisión marcada como pagada');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar como pagada');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Euro className="w-3 h-3 mr-1" />Pagada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.clientCompanyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comisiones de Partners</h1>
            <p className="text-gray-600 mt-1">Gestiona las comisiones generadas por tus partners</p>
          </div>
          <Button onClick={() => toast.info('Exportando...')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pendientes de Pago</p>
                    <p className="text-2xl font-bold text-yellow-600">€{stats.totalPending.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aprobadas</p>
                    <p className="text-2xl font-bold text-blue-600">€{stats.totalApproved.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Pagado</p>
                    <p className="text-2xl font-bold text-green-600">€{stats.totalPaid.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Euro className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Partners Activos</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.partnersActive}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por partner o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Comisiones</CardTitle>
            <CardDescription>
              {filteredCommissions.length} comisiones encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Cliente Referido</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Precio Plan</TableHead>
                  <TableHead className="text-right">% Comisión</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{commission.partnerName}</p>
                        <p className="text-sm text-gray-500">{commission.partnerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {commission.clientCompanyName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{commission.planName}</Badge>
                    </TableCell>
                    <TableCell className="text-right">€{commission.planPrice}</TableCell>
                    <TableCell className="text-right">{commission.commissionRate}%</TableCell>
                    <TableCell className="text-right font-semibold">€{commission.commissionAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {format(new Date(commission.periodStart), 'MMM yyyy', { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCommission(commission);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {commission.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(commission.id)}
                          >
                            Aprobar
                          </Button>
                        )}
                        {commission.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(commission.id)}
                          >
                            Marcar Pagada
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Comisión</DialogTitle>
              <DialogDescription>
                Información completa de la comisión
              </DialogDescription>
            </DialogHeader>
            {selectedCommission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Partner</p>
                    <p className="font-medium">{selectedCommission.partnerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{selectedCommission.clientCompanyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="font-medium">{selectedCommission.planName} - €{selectedCommission.planPrice}/mes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Comisión</p>
                    <p className="font-medium">{selectedCommission.commissionRate}% = €{selectedCommission.commissionAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    {getStatusBadge(selectedCommission.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Período</p>
                    <p className="font-medium">
                      {format(new Date(selectedCommission.periodStart), 'dd MMM', { locale: es })} - {format(new Date(selectedCommission.periodEnd), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
