import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface SalesRep {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
  codigoReferido: string;
  estado: string;
  activo: boolean;
  totalLeadsGenerados: number;
  totalConversiones: number;
  tasaConversion: number;
  totalComisionGenerada: number;
  createdAt: string;
}

export default function SalesRepresentatives() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [representatives, setRepresentatives] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    iban: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'administrador') {
      router.push('/dashboard');
      return;
    }

    loadRepresentatives();
  }, [session, status, router]);

  const loadRepresentatives = async () => {
    try {
      const params = new URLSearchParams();
      if (estadoFilter && estadoFilter !== 'all') params.append('estado', estadoFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/sales-team/representatives?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRepresentatives(data);
      }
    } catch (error) {
      console.error('Error cargando comerciales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/sales-team/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Comercial creado exitosamente');
        setShowCreateDialog(false);
        setFormData({
          nombre: '',
          apellidos: '',
          dni: '',
          email: '',
          telefono: '',
          password: '',
          iban: '',
          direccion: '',
          ciudad: '',
          codigoPostal: '',
        });
        loadRepresentatives();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear comercial');
      }
    } catch (error) {
      toast.error('Error al crear comercial');
    } finally {
      setCreating(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      ACTIVO: 'bg-green-100 text-green-800',
      INACTIVO: 'bg-gray-100 text-gray-800',
      SUSPENDIDO: 'bg-yellow-100 text-yellow-800',
      CANCELADO: 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comerciales...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Comerciales Externos - INMOVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Comerciales Externos</h1>
              <p className="text-gray-600">Gestionar equipo comercial autónomo</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Comercial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Comercial</DialogTitle>
                  <DialogDescription>
                    Completa la información del comercial externo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellidos">Apellidos *</Label>
                      <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dni">DNI/NIE *</Label>
                      <Input
                        id="dni"
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="iban">IBAN (para pagos)</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="ES00 0000 0000 0000 0000 0000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <Input
                        id="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creando...' : 'Crear Comercial'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre, email, DNI o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                      <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadRepresentatives}>Buscar</Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de comerciales */}
          <Card>
            <CardHeader>
              <CardTitle>Comerciales ({representatives.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Comercial</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Código</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Leads</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Conversiones</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Tasa</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Comisiones</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {representatives.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron comerciales
                        </td>
                      </tr>
                    ) : (
                      representatives.map((rep) => (
                        <tr key={rep.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{rep.nombreCompleto}</div>
                              <div className="text-sm text-gray-500">{rep.email}</div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{rep.codigoReferido}</code>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getEstadoBadge(rep.estado)}>{rep.estado}</Badge>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">{rep.totalLeadsGenerados}</td>
                          <td className="text-center py-3 px-4 text-gray-700">{rep.totalConversiones}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                              <span className="font-medium">{rep.tasaConversion.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                              rep.totalComisionGenerada
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            <Link href={`/admin/sales-team/representatives/${rep.id}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
