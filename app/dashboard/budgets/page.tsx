'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  Plus,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Budget {
  id: string;
  numero: string;
  cliente: string;
  concepto: string;
  importe: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'convertido';
  fechaCreacion: string;
  fechaValidez: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const filteredBudgets = budgets.filter((budget) => {
    const matchSearch =
      budget.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.concepto?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || budget.estado === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: budgets.length,
    pendientes: budgets.filter((b) => b.estado === 'pendiente').length,
    aprobados: budgets.filter((b) => b.estado === 'aprobado').length,
    rechazados: budgets.filter((b) => b.estado === 'rechazado').length,
    importeTotal: budgets
      .filter((b) => b.estado === 'aprobado')
      .reduce((sum, b) => sum + (b.importe || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      case 'convertido':
        return <Badge className="bg-blue-100 text-blue-700"><FileText className="h-3 w-3 mr-1" />Convertido</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona presupuestos y estimaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBudgets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/presupuestos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              {loading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold">{stats.total}</p>
              )}
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              {loading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              )}
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              {loading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-green-600">{stats.aprobados}</p>
              )}
              <p className="text-sm text-muted-foreground">Aprobados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              {loading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-red-600">{stats.rechazados}</p>
              )}
              <p className="text-sm text-muted-foreground">Rechazados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              {loading ? (
                <Skeleton className="h-8 w-16 mx-auto" />
              ) : (
                <p className="text-2xl font-bold">{stats.importeTotal.toLocaleString()}€</p>
              )}
              <p className="text-sm text-muted-foreground">Importe Aprobado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="aprobado">Aprobados</SelectItem>
                <SelectItem value="rechazado">Rechazados</SelectItem>
                <SelectItem value="convertido">Convertidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron presupuestos</p>
              <Link href="/presupuestos/nuevo">
                <Button variant="outline" className="mt-4">
                  Crear primer presupuesto
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-mono">{budget.numero}</TableCell>
                    <TableCell>{budget.cliente}</TableCell>
                    <TableCell className="max-w-xs truncate">{budget.concepto}</TableCell>
                    <TableCell className="text-right font-medium">
                      {(budget.importe || 0).toLocaleString()}€
                    </TableCell>
                    <TableCell>{getStatusBadge(budget.estado)}</TableCell>
                    <TableCell>
                      {budget.fechaCreacion
                        ? new Date(budget.fechaCreacion).toLocaleDateString('es-ES')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
