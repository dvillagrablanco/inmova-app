'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Sprout,
  Sun,
  Droplets,
  Calendar,
  MapPin,
  Users,
  Leaf,
  CheckCircle,
} from 'lucide-react';

interface UrbanGarden {
  id: string;
  buildingId: string;
  buildingName: string;
  totalPlots: number;
  availablePlots: number;
  plotSize: number;
  pricePerMonth: number;
  location: string;
  amenities: string[];
}

interface MyPlot {
  id: string;
  gardenId: string;
  plotNumber: string;
  plantedCrops: string[];
  lastWatered: string;
  nextHarvest: string;
  status: string;
}

export default function HuertosUrbanosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gardens, setGardens] = useState<UrbanGarden[]>([]);
  const [myPlots, setMyPlots] = useState<MyPlot[]>([]);
  const [selectedGarden, setSelectedGarden] = useState<UrbanGarden | null>(null);
  const [openReserveDialog, setOpenReserveDialog] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    gardenId: '',
    months: 6,
  });

  const handleManagePlot = (plotNumber: number) => {
    toast.info(`Gestionar parcela ${plotNumber}`);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gardensRes, plotsRes] = await Promise.all([
        fetch('/api/circular-economy/gardens'),
        fetch('/api/circular-economy/gardens/my-plots'),
      ]);

      if (gardensRes.ok) {
        const data = await gardensRes.json();
        setGardens(data);
      }
      if (plotsRes.ok) {
        const data = await plotsRes.json();
        setMyPlots(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    try {
      const response = await fetch('/api/circular-economy/gardens/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reserveForm),
      });

      if (response.ok) {
        toast.success('Parcela reservada exitosamente');
        setOpenReserveDialog(false);
        fetchData();
      } else {
        throw new Error('Error al reservar');
      }
    } catch (error) {
      toast.error('Error al reservar la parcela');
    }
  };

  const openReserve = (garden: UrbanGarden) => {
    setSelectedGarden(garden);
    setReserveForm({ gardenId: garden.id, months: 6 });
    setOpenReserveDialog(true);
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sprout className="h-8 w-8 text-green-600" />
              Huertos Urbanos
            </h1>
            <p className="text-muted-foreground mt-1">
              Reserva tu parcela y cultiva en la azotea de tu edificio
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{gardens.length}</div>
                  <p className="text-sm text-muted-foreground">Huertos disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {gardens.reduce((sum, g) => sum + g.availablePlots, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Parcelas libres</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{myPlots.length}</div>
                  <p className="text-sm text-muted-foreground">Mis parcelas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-2xl font-bold">25 kg</div>
                  <p className="text-sm text-muted-foreground">CO₂ ahorrado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Plots */}
        {myPlots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Parcelas</CardTitle>
              <CardDescription>Gestiona tus cultivos activos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPlots.map((plot) => (
                  <div key={plot.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Parcela {plot.plotNumber}</span>
                      </div>
                      <Badge
                        className={
                          plot.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }
                      >
                        {plot.status === 'active' ? 'Activa' : 'Pendiente'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Leaf className="h-4 w-4 text-muted-foreground" />
                        <span>Cultivos: {plot.plantedCrops.join(', ') || 'Sin plantar'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span>Último riego: {plot.lastWatered || 'Nunca'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span>Próxima cosecha: {plot.nextHarvest || 'N/A'}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => handleManagePlot(plot.plotNumber)}
                    >
                      Gestionar Parcela
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Gardens */}
        <Card>
          <CardHeader>
            <CardTitle>Huertos Disponibles</CardTitle>
            <CardDescription>Reserva una parcela en tu edificio o cerca</CardDescription>
          </CardHeader>
          <CardContent>
            {gardens.length === 0 ? (
              <div className="text-center py-12">
                <Sprout className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay huertos disponibles</h3>
                <p className="text-sm text-muted-foreground">
                  Próximamente nuevas ubicaciones
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gardens.map((garden) => (
                  <Card key={garden.id} className="hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-lg flex items-center justify-center">
                      <Sprout className="h-16 w-16 text-green-300" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{garden.buildingName}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {garden.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Parcelas disponibles:</span>
                          <span className="font-medium">
                            {garden.availablePlots} / {garden.totalPlots}
                          </span>
                        </div>
                        <Progress
                          value={
                            ((garden.totalPlots - garden.availablePlots) / garden.totalPlots) *
                            100
                          }
                          className="h-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tamaño:</span>
                          <span className="font-medium ml-1">{garden.plotSize}m²</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precio:</span>
                          <span className="font-medium ml-1">€{garden.pricePerMonth}/mes</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {garden.amenities.map((amenity, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        className="w-full"
                        disabled={garden.availablePlots === 0}
                        onClick={() => openReserve(garden)}
                      >
                        {garden.availablePlots > 0 ? 'Reservar Parcela' : 'Sin disponibilidad'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reserve Dialog */}
        <Dialog open={openReserveDialog} onOpenChange={setOpenReserveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reservar Parcela</DialogTitle>
              <DialogDescription>
                {selectedGarden?.buildingName} - €{selectedGarden?.pricePerMonth}/mes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Duración de la reserva</Label>
                <Select
                  value={reserveForm.months.toString()}
                  onValueChange={(v) => setReserveForm({ ...reserveForm, months: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses (10% dto.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">Resumen de la reserva</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tamaño de parcela:</span>
                    <span>{selectedGarden?.plotSize}m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio mensual:</span>
                    <span>€{selectedGarden?.pricePerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duración:</span>
                    <span>{reserveForm.months} meses</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>
                      €
                      {(
                        (selectedGarden?.pricePerMonth || 0) *
                        reserveForm.months *
                        (reserveForm.months === 12 ? 0.9 : 1)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Incluido en tu parcela:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Acceso 24/7 a la azotea
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Sistema de riego compartido
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Herramientas básicas incluidas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Talleres de agricultura urbana
                  </li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenReserveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReserve}>Confirmar Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
