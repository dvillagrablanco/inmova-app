'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  FileText, 
  Brain, 
  Megaphone, 
  MessageCircle, 
  Euro, 
  Code, 
  Palette,
  Check,
  Sparkles,
  CreditCard,
  Search,
  Star,
  Zap,
  Settings,
  ChevronRight,
  Package,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface Addon {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioMensual: number;
  precioAnual: number;
  caracteristicas: string[];
  activo: boolean;
  popular?: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
}

const iconMap: Record<string, React.ElementType> = {
  'file-text': FileText,
  'brain': Brain,
  'megaphone': Megaphone,
  'message-circle': MessageCircle,
  'euro': Euro,
  'code': Code,
  'palette': Palette,
};

export default function AddonsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState<'mensual' | 'anual'>('mensual');
  const [resumen, setResumen] = useState({ total: 0, activos: 0, gastoMensual: 0 });

  useEffect(() => {
    // Verificar si venimos de un checkout exitoso
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const addonId = searchParams.get('addon');

    if (success === 'true') {
      toast.success('¡Add-on activado exitosamente!');
      // Limpiar URL
      window.history.replaceState({}, '', '/admin/addons');
    } else if (canceled === 'true') {
      toast.info('Pago cancelado');
      window.history.replaceState({}, '', '/admin/addons');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadAddons();
    }
  }, [status, categoriaActiva]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoriaActiva !== 'all') {
        params.set('categoria', categoriaActiva);
      }

      const response = await fetch(`/api/addons?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAddons(data.addons || []);
        setCategorias(data.categorias || []);
        setResumen(data.resumen || { total: 0, activos: 0, gastoMensual: 0 });
      }
    } catch (error) {
      console.error('Error cargando addons:', error);
      toast.error('Error al cargar los add-ons');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddon = async (addon: Addon) => {
    setProcesando(addon.id);
    try {
      if (addon.activo) {
        // Desactivar
        const response = await fetch('/api/addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonId: addon.id, accion: 'desactivar' }),
        });

        if (response.ok) {
          toast.success(`${addon.nombre} desactivado`);
          loadAddons();
        }
      } else {
        // Activar - ir a checkout
        handleComprar(addon);
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setProcesando(null);
    }
  };

  const handleComprar = async (addon: Addon) => {
    setProcesando(addon.id);
    try {
      const response = await fetch('/api/addons/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          addonId: addon.id, 
          plan: planSeleccionado,
        }),
      });

      const data = await response.json();

      if (data.mode === 'demo') {
        // Modo demo - activar directamente
        const activarResponse = await fetch('/api/addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonId: addon.id, accion: 'activar' }),
        });

        if (activarResponse.ok) {
          toast.success(`${addon.nombre} activado (modo demo)`);
          loadAddons();
        }
      } else if (data.checkoutUrl) {
        // Redirigir a Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || 'Error al procesar el pago');
      }
    } catch (error) {
      toast.error('Error al iniciar el pago');
    } finally {
      setProcesando(null);
    }
  };

  const addonsFiltrados = addons.filter(addon => {
    if (busqueda) {
      return (
        addon.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        addon.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Add-ons y Extensiones
            </h1>
            <p className="text-muted-foreground mt-1">
              Potencia tu plataforma con funcionalidades adicionales
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar add-ons..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Add-ons Disponibles</p>
                  <p className="text-3xl font-bold">{resumen.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Add-ons Activos</p>
                  <p className="text-3xl font-bold text-green-600">{resumen.activos}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gasto Mensual</p>
                  <p className="text-3xl font-bold">{resumen.gastoMensual}€</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center">
          <div className="bg-muted p-1 rounded-lg inline-flex items-center gap-1">
            <button
              onClick={() => setPlanSeleccionado('mensual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                planSeleccionado === 'mensual' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPlanSeleccionado('anual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                planSeleccionado === 'anual' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                -17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Categorías */}
        <Tabs value={categoriaActiva} onValueChange={setCategoriaActiva}>
          <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todos
            </TabsTrigger>
            {categorias.map((cat) => {
              const Icon = iconMap[cat.icono] || Package;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {cat.nombre}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={categoriaActiva} className="mt-6">
            {/* Grid de Add-ons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addonsFiltrados.map((addon) => (
                <Card 
                  key={addon.id} 
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    addon.activo ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {addon.popular && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  {addon.activo && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-500 text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    </div>
                  )}
                  <CardHeader className={addon.popular || addon.activo ? 'pt-12' : ''}>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {addon.nombre}
                    </CardTitle>
                    <CardDescription>{addon.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {planSeleccionado === 'anual' 
                            ? Math.round(addon.precioAnual / 12) 
                            : addon.precioMensual}€
                        </span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                      {planSeleccionado === 'anual' && (
                        <p className="text-sm text-green-600">
                          Facturado anualmente ({addon.precioAnual}€/año)
                        </p>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {addon.caracteristicas.map((caracteristica, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{caracteristica}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {addon.activo ? (
                      <>
                        <Button variant="outline" className="flex-1" disabled>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Activo
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleAddon(addon)}
                          disabled={procesando === addon.id}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleComprar(addon)}
                        disabled={procesando === addon.id}
                      >
                        {procesando === addon.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Activar Add-on
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {addonsFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No se encontraron add-ons</h3>
                <p className="text-muted-foreground">
                  Intenta con otra búsqueda o categoría
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold mb-2">
                  ¿Necesitas una funcionalidad personalizada?
                </h3>
                <p className="text-muted-foreground">
                  Contacta con nuestro equipo para desarrollar integraciones a medida para tu negocio.
                  Ofrecemos desarrollo personalizado, API dedicadas y soporte prioritario.
                </p>
              </div>
              <Button variant="outline" className="shrink-0">
                Contactar Ventas
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
