'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Trash2,
  AlertTriangle,
  Building2,
  Users,
  Loader2,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Company {
  id: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  _count: {
    users: number;
    buildings: number;
    tenants: number;
  };
}

interface CompanyData {
  total: number;
  demoCompanies: Company[];
  realCompanies: Company[];
  demoCount: number;
  realCount: number;
}

export default function LimpiezaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<CompanyData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'selected' | 'all'>('selected');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/dashboard');
        toast.error('Solo Super Admin puede acceder');
        return;
      }
      loadCompanies();
    }
  }, [status, session, router]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cleanup/demo-companies');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Error cargando empresas');
      }
    } catch (error) {
      toast.error('Error cargando empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAllDemo = () => {
    if (data?.demoCompanies) {
      const allDemoIds = new Set(data.demoCompanies.map((c) => c.id));
      setSelectedIds(allDemoIds);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      let url = '/api/admin/cleanup/demo-companies';
      
      if (deleteMode === 'all') {
        url += '?all=true';
      } else if (selectedIds.size > 0) {
        url += `?ids=${Array.from(selectedIds).join(',')}`;
      } else {
        toast.error('Selecciona al menos una empresa');
        setDeleting(false);
        return;
      }

      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();

      if (response.ok) {
        toast.success(`${result.deleted} empresas eliminadas`);
        setSelectedIds(new Set());
        loadCompanies();
      } else {
        toast.error(result.error || 'Error eliminando');
      }
    } catch (error) {
      toast.error('Error eliminando empresas');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trash2 className="h-8 w-8" />
              Limpieza de Datos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y elimina empresas demo/test de la base de datos
            </p>
          </div>
          <Button variant="outline" onClick={loadCompanies}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Empresas</p>
                  <p className="text-2xl font-bold">{data?.total || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Empresas Demo/Test</p>
                  <p className="text-2xl font-bold text-yellow-800">{data?.demoCount || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Empresas Reales</p>
                  <p className="text-2xl font-bold text-green-800">{data?.realCount || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Companies */}
        {data?.demoCompanies && data.demoCompanies.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-yellow-800">⚠️ Empresas Demo/Test Detectadas</CardTitle>
                  <CardDescription>
                    Estas empresas parecen ser de prueba y pueden eliminarse
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllDemo}>
                    Seleccionar Todas
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedIds.size === 0}
                    onClick={() => {
                      setDeleteMode('selected');
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Seleccionadas ({selectedIds.size})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Edificios</TableHead>
                    <TableHead>Inquilinos</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.demoCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(company.id)}
                          onCheckedChange={(checked) =>
                            handleSelectCompany(company.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{company.nombre}</TableCell>
                      <TableCell>{company._count.users}</TableCell>
                      <TableCell>{company._count.buildings}</TableCell>
                      <TableCell>{company._count.tenants}</TableCell>
                      <TableCell>
                        {format(new Date(company.createdAt), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Real Companies */}
        {data?.realCompanies && data.realCompanies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Empresas Reales</CardTitle>
              <CardDescription>
                Estas empresas no coinciden con patrones de prueba
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Edificios</TableHead>
                    <TableHead>Inquilinos</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.realCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={company.activo ? 'default' : 'secondary'}>
                          {company.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>{company._count.users}</TableCell>
                      <TableCell>{company._count.buildings}</TableCell>
                      <TableCell>{company._count.tenants}</TableCell>
                      <TableCell>
                        {format(new Date(company.createdAt), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {data && data.total === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay empresas en la base de datos</p>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente{' '}
                <strong>{selectedIds.size} empresa(s)</strong> y todos sus datos asociados:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Usuarios</li>
                  <li>Edificios y Unidades</li>
                  <li>Inquilinos y Contratos</li>
                  <li>Pagos y Mantenimientos</li>
                </ul>
                <p className="mt-2 text-red-600 font-semibold">
                  Esta acción NO se puede deshacer.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Eliminar Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthenticatedLayout>
  );
}
