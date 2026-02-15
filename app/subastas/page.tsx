'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Gavel,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle,
  Timer,
  ArrowUp,
  AlertCircle,
  Building,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface Auction {
  id: string;
  titulo: string;
  descripcion: string;
  precioInicial: number;
  precioReserva?: number;
  pujaActual: number;
  incrementoMinimo: number;
  fechaInicio: string;
  fechaFin: string;
  numeroPujas: number;
  estado: string;
  tipo: string;
  imagenes: string[];
  unitId?: string;
  buildingId?: string;
}

interface Stats {
  total: number;
  activas: number;
  programadas: number;
  finalizadas: number;
  valorTotal: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SubastasPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('activas');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);

  // Form state
  const [newAuction, setNewAuction] = useState({
    titulo: '',
    descripcion: '',
    precioInicial: 0,
    precioReserva: 0,
    incrementoMinimo: 1000,
    fechaInicio: '',
    fechaFin: '',
    tipo: 'venta',
    buildingId: '',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar edificios
      const buildingsRes = await fetch('/api/buildings?limit=100');
      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(Array.isArray(data) ? data : data.data || []);
      }

      await loadAuctions();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuctions = async () => {
    try {
      const response = await fetch('/api/auctions');
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
      toast.error('Error al cargar subastas');
    }
  };

  // Crear subasta
  const handleCreate = async () => {
    if (!newAuction.titulo || !newAuction.precioInicial || !newAuction.fechaInicio || !newAuction.fechaFin) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAuction),
      });

      if (response.ok) {
        toast.success('Subasta creada exitosamente');
        setShowNewDialog(false);
        resetForm();
        loadAuctions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear subasta');
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      toast.error('Error al crear subasta');
    }
  };

  // Realizar puja
  const handleBid = async () => {
    if (!selectedAuction) return;

    const minBid = selectedAuction.pujaActual + selectedAuction.incrementoMinimo;
    if (bidAmount < minBid) {
      toast.error(`La puja mínima es €${minBid.toLocaleString()}`);
      return;
    }

    toast.success(`Puja de €${bidAmount.toLocaleString()} registrada`);
    setShowBidDialog(false);
    setBidAmount(0);
    setSelectedAuction(null);
    loadAuctions();
  };

  const resetForm = () => {
    setNewAuction({
      titulo: '',
      descripcion: '',
      precioInicial: 0,
      precioReserva: 0,
      incrementoMinimo: 1000,
      fechaInicio: '',
      fechaFin: '',
      tipo: 'venta',
      buildingId: '',
    });
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-700';
      case 'programada': return 'bg-blue-100 text-blue-700';
      case 'finalizada': return 'bg-gray-100 text-gray-700';
      case 'cancelada': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Calcular tiempo restante
  const getTimeRemaining = (fechaFin: string) => {
    const end = new Date(fechaFin);
    const now = new Date();
    const hours = differenceInHours(end, now);
    const minutes = differenceInMinutes(end, now) % 60;
    
    if (hours < 0) return 'Finalizada';
    if (hours < 1) return `${minutes}min`;
    if (hours < 24) return `${hours}h ${minutes}min`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };

  // Filtrar subastas
  const filteredAuctions = auctions.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'todas' || a.estado === activeTab;
    return matchesSearch && matchesTab;
  });

  // Loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Gavel className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Subastas de Propiedades</h1>
              <p className="text-muted-foreground">
                Sistema de subastas online
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Subasta
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Gavel className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total subastas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Timer className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.activas || 0}</p>
                  <p className="text-xs text-muted-foreground">En curso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.programadas || 0}</p>
                  <p className="text-xs text-muted-foreground">Programadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">€{((stats?.valorTotal || 0) / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Valor en pujas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar subastas..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={loadAuctions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="activas">En curso ({auctions.filter(a => a.estado === 'activa').length})</TabsTrigger>
            <TabsTrigger value="programada">Programadas ({auctions.filter(a => a.estado === 'programada').length})</TabsTrigger>
            <TabsTrigger value="finalizada">Finalizadas ({auctions.filter(a => a.estado === 'finalizada').length})</TabsTrigger>
            <TabsTrigger value="todas">Todas ({auctions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredAuctions.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No hay subastas</h3>
                  <p className="text-muted-foreground">Crea tu primera subasta</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAuctions.map(auction => (
                  <Card key={auction.id} className="hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <Building className="h-16 w-16 text-white opacity-50" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-1">{auction.titulo}</CardTitle>
                        <Badge className={getEstadoColor(auction.estado)}>
                          {auction.estado}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {auction.descripcion}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Puja actual</span>
                        <span className="text-xl font-bold text-green-600">
                          €{auction.pujaActual.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio inicial</span>
                        <span>€{auction.precioInicial.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pujas</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {auction.numeroPujas}
                        </span>
                      </div>
                      {auction.estado === 'activa' && (
                        <div className="flex items-center justify-between text-sm bg-amber-50 p-2 rounded">
                          <span className="flex items-center gap-1 text-amber-700">
                            <Clock className="h-3 w-3" />
                            Tiempo restante
                          </span>
                          <span className="font-bold text-amber-700">
                            {getTimeRemaining(auction.fechaFin)}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {auction.estado === 'activa' && (
                          <Button
                            className="flex-1"
                            size="sm"
                            onClick={() => {
                              setSelectedAuction(auction);
                              setBidAmount(auction.pujaActual + auction.incrementoMinimo);
                              setShowBidDialog(true);
                            }}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Pujar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Nueva Subasta */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Subasta</DialogTitle>
            <DialogDescription>Configura los detalles de la subasta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Piso en zona centro..."
                value={newAuction.titulo}
                onChange={e => setNewAuction(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción detallada de la propiedad..."
                value={newAuction.descripcion}
                onChange={e => setNewAuction(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Inicial (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={newAuction.precioInicial}
                  onChange={e => setNewAuction(prev => ({ ...prev, precioInicial: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Reserva (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newAuction.precioReserva}
                  onChange={e => setNewAuction(prev => ({ ...prev, precioReserva: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Incremento Mínimo (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newAuction.incrementoMinimo}
                  onChange={e => setNewAuction(prev => ({ ...prev, incrementoMinimo: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newAuction.tipo}
                  onValueChange={v => setNewAuction(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta">Venta</SelectItem>
                    <SelectItem value="alquiler">Alquiler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha Inicio *</Label>
                <Input
                  type="datetime-local"
                  value={newAuction.fechaInicio}
                  onChange={e => setNewAuction(prev => ({ ...prev, fechaInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin *</Label>
                <Input
                  type="datetime-local"
                  value={newAuction.fechaFin}
                  onChange={e => setNewAuction(prev => ({ ...prev, fechaFin: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Edificio (opcional)</Label>
              <Select
                value={newAuction.buildingId}
                onValueChange={v => setNewAuction(prev => ({ ...prev, buildingId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar edificio" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear Subasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Realizar Puja */}
      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar Puja</DialogTitle>
            <DialogDescription>
              {selectedAuction?.titulo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puja actual</span>
                <span className="font-bold">€{selectedAuction?.pujaActual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puja mínima</span>
                <span className="font-bold text-green-600">
                  €{((selectedAuction?.pujaActual || 0) + (selectedAuction?.incrementoMinimo || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tu puja (€)</Label>
              <Input
                type="number"
                min={(selectedAuction?.pujaActual || 0) + (selectedAuction?.incrementoMinimo || 0)}
                value={bidAmount}
                onChange={e => setBidAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>Las pujas son vinculantes</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBid}>
              Confirmar Puja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
