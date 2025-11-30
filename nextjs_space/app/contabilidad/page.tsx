'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Building2,
  CreditCard,
  PieChart,
  Calculator,
  Receipt,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ContabilidadPage() {
  const { data: session } = useSession() || {};
  const [periodo, setPeriodo] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  
  // Estados para diferentes secciones
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [costCentersData, setCostCentersData] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any>(null);
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [ratiosData, setRatiosData] = useState<any>(null);
  const [zucchettiStatus, setZucchettiStatus] = useState<any>(null);
  const [contaSimpleStatus, setContaSimpleStatus] = useState<any>(null);
  const [sageStatus, setSageStatus] = useState<any>(null);
  const [holdedStatus, setHoldedStatus] = useState<any>(null);
  const [a3Status, setA3Status] = useState<any>(null);
  const [alegraStatus, setAlegraStatus] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.companyId) {
      loadFinancialData();
      loadZucchettiStatus();
      loadContaSimpleStatus();
      loadSageStatus();
      loadHoldedStatus();
      loadA3Status();
      loadAlegraStatus();
    }
  }, [session, periodo]);

  const loadZucchettiStatus = async () => {
    try {
      const res = await fetch('/api/accounting/zucchetti/status');
      if (res.ok) {
        const data = await res.json();
        setZucchettiStatus(data);
      }
    } catch (error) {
      console.error('Error al cargar estado de Zucchetti:', error);
    }
  };

  const loadContaSimpleStatus = async () => {
    try {
      const res = await fetch('/api/accounting/contasimple/status');
      if (res.ok) {
        const data = await res.json();
        setContaSimpleStatus(data);
      }
    } catch (error) {
      console.error('Error al cargar estado de ContaSimple:', error);
    }
  };

  const loadSageStatus = async () => {
    try {
      const res = await fetch('/api/accounting/sage/status');
      if (res.ok) {
        const data = await res.json();
        setSageStatus(data);
      }
    } catch (error) {
      console.error('Error al cargar estado de Sage:', error);
    }
  };

  const loadHoldedStatus = async () => {
    try {
      const res = await fetch('/api/accounting/holded/status');
      if (res.ok) {
        const data = await res.json();
        setHoldedStatus(data);
      }
    } catch (error) {
      console.error('Error al cargar estado de Holded:', error);
    }
  };

  const loadA3Status = async () => {
    try {
      const res = await fetch('/api/accounting/a3/status');
      if (res.ok) {
        const data = await res.json();
        setA3Status(data);
      }
    } catch (error) {
      console.error('Error al cargar estado de A3:', error);
    }
  };

  const loadAlegraStatus = async () => {
    try {
      const res = await fetch('/api/accounting/alegra/status');
      if (res.ok) {
        const data = await res.json();
        setAlegraStatus(data);
      }
    } catch (error) {
      console.error('Error al cargar estado de Alegra:', error);
    }
  };

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Cargar contabilidad analítica
      const analyticsRes = await fetch(`/api/accounting/analytics?periodo=${periodo}`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalyticsData(data.data);
      }

      // Cargar centros de coste
      const costCentersRes = await fetch(`/api/accounting/cost-centers?periodo=${periodo}`);
      if (costCentersRes.ok) {
        const data = await costCentersRes.json();
        setCostCentersData(data.data || []);
      }

      // Cargar información fiscal
      const taxRes = await fetch(`/api/accounting/tax-summary?periodo=${periodo}`);
      if (taxRes.ok) {
        const data = await taxRes.json();
        setTaxData(data.data);
      }

      // Cargar cuenta de pérdidas y ganancias
      const profitLossRes = await fetch(`/api/accounting/profit-loss?periodo=${periodo}`);
      if (profitLossRes.ok) {
        const data = await profitLossRes.json();
        setProfitLossData(data.data);
      }

      // Cargar ratios financieros
      const ratiosRes = await fetch(`/api/accounting/ratios?periodo=${periodo}`);
      if (ratiosRes.ok) {
        const data = await ratiosRes.json();
        setRatiosData(data.data);
      }

    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleSyncZucchetti = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/sync-zucchetti', { method: 'POST' });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.configured) {
          toast.success('Sincronización con Zucchetti completada');
          loadFinancialData();
        } else {
          toast.warning(data.message || 'La integración con Zucchetti no está configurada');
        }
      } else {
        toast.error('Error al sincronizar con Zucchetti');
      }
    } catch (error) {
      console.error('Error al sincronizar con Zucchetti:', error);
      toast.error('Error al sincronizar con Zucchetti');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCustomers = async () => {
    try {
      setLoading(true);
      toast.info('Sincronizando clientes...');
      // Aquí se implementaría la lógica para seleccionar inquilinos y sincronizar
      toast.success('Funcionalidad en desarrollo');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al sincronizar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      toast.info('Creando facturas...');
      // Aquí se implementaría la lógica para crear facturas desde contratos
      toast.success('Funcionalidad en desarrollo');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayments = async () => {
    try {
      setLoading(true);
      toast.info('Registrando pagos...');
      // Aquí se implementaría la lógica para registrar pagos
      toast.success('Funcionalidad en desarrollo');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar pagos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones genéricas para los nuevos sistemas
  const handleSyncCustomersSystem = async (system: string) => {
    try {
      setLoading(true);
      toast.info(`Sincronizando clientes con ${system.toUpperCase()}...`);
      
      const res = await fetch(`/api/accounting/${system}/sync-customers`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Error al sincronizar');
      }
      
      const data = await res.json();
      toast.success(data.message || 'Clientes sincronizados exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error al sincronizar clientes con ${system.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoiceSystem = async (system: string) => {
    try {
      setLoading(true);
      toast.info(`Creando facturas en ${system.toUpperCase()}...`);
      
      const res = await fetch(`/api/accounting/${system}/create-invoice`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Error al crear facturas');
      }
      
      const data = await res.json();
      toast.success(data.message || 'Facturas creadas exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error al crear facturas en ${system.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPaymentsSystem = async (system: string) => {
    try {
      setLoading(true);
      toast.info(`Registrando pagos en ${system.toUpperCase()}...`);
      
      const res = await fetch(`/api/accounting/${system}/register-payment`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Error al registrar pagos');
      }
      
      const data = await res.json();
      toast.success(data.message || 'Pagos registrados exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error al registrar pagos en ${system.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Debes iniciar sesión para acceder al módulo de contabilidad.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="ml-0 lg:ml-64 container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Panel de control para el Director Financiero - Contabilidad Analítica, Costes y Fiscalidad
          </p>
        </div>
        <div className="flex gap-3">
          {zucchettiStatus?.configured && (
            <Button onClick={handleSyncZucchetti} variant="outline" disabled={loading}>
              <FileText className="h-4 w-4 mr-2" />
              Sincronizar con Zucchetti
            </Button>
          )}
          <Button onClick={loadFinancialData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="border rounded-md px-3 py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitLossData?.ingresos.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Período {periodo}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitLossData?.gastos.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Período {periodo}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitLossData?.beneficioNeto || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margen: {formatPercentage(profitLossData?.margenes.neto || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitLossData?.ebitda || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margen Operativo: {formatPercentage(profitLossData?.margenes.operativo || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con contenido detallado */}
      <Tabs defaultValue="integraciones" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
          <TabsTrigger value="pyg">P&G</TabsTrigger>
          <TabsTrigger value="analitica">Analítica</TabsTrigger>
          <TabsTrigger value="centros">Centros Coste</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
        </TabsList>

        {/* Integraciones ERP/Contabilidad */}
        <TabsContent value="integraciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones de Contabilidad</CardTitle>
              <CardDescription>
                Conecta INMOVA con tu sistema ERP o software de contabilidad favorito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Zucchetti Integration */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Zucchetti (Altai)</h3>
                      {zucchettiStatus?.configured ? (
                        <Badge variant="default">✓ Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Demo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sistema ERP y contabilidad líder en Europa
                    </p>
                  </div>
                  <Button
                    onClick={() => loadZucchettiStatus()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {zucchettiStatus && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Funcionalidades disponibles:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {zucchettiStatus.features?.map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleSyncCustomers}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Sincronizar Clientes
                      </Button>
                      <Button
                        onClick={handleCreateInvoice}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Crear Facturas
                      </Button>
                      <Button
                        onClick={handleRegisterPayments}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagos
                      </Button>
                    </div>

                    {!zucchettiStatus.configured && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Modo Demo:</strong> {zucchettiStatus.message}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          Para activar la integración real, configura las variables de entorno
                          ZUCCHETTI_CLIENT_ID, ZUCCHETTI_CLIENT_SECRET y ZUCCHETTI_API_KEY
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ContaSimple Integration */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">ContaSimple</h3>
                      {contaSimpleStatus?.configured ? (
                        <Badge variant="default">✓ Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Demo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Software de facturación y contabilidad para pymes españolas
                    </p>
                  </div>
                  <Button
                    onClick={() => loadContaSimpleStatus()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {contaSimpleStatus && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Funcionalidades disponibles:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {contaSimpleStatus.features?.map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleSyncCustomers}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Sincronizar Clientes
                      </Button>
                      <Button
                        onClick={handleCreateInvoice}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Crear Facturas
                      </Button>
                      <Button
                        onClick={handleRegisterPayments}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagos
                      </Button>
                      <Button
                        onClick={() => {
                          toast.info('Registrando gastos...');
                          toast.success('Funcionalidad en desarrollo');
                        }}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Registrar Gastos
                      </Button>
                    </div>

                    {!contaSimpleStatus.configured && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Modo Demo:</strong> {contaSimpleStatus.message}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          Para activar la integración real, configura las variables de entorno
                          CONTASIMPLE_CLIENT_ID, CONTASIMPLE_CLIENT_SECRET y CONTASIMPLE_API_KEY
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sage Integration */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Sage</h3>
                      {sageStatus?.integrated ? (
                        <Badge variant="default">✓ Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Demo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sageStatus?.description || 'Líder mundial en software de contabilidad'}
                    </p>
                  </div>
                  <Button
                    onClick={() => loadSageStatus()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {sageStatus && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Funcionalidades disponibles:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {sageStatus.features?.map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleSyncCustomersSystem('sage')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Sincronizar Clientes
                      </Button>
                      <Button
                        onClick={() => handleCreateInvoiceSystem('sage')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Crear Facturas
                      </Button>
                      <Button
                        onClick={() => handleRegisterPaymentsSystem('sage')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagos
                      </Button>
                    </div>

                    {!sageStatus.integrated && (
                      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Modo Demo:</strong> Esta integración está en modo demostración.
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                          Para activar la integración real, configura las variables de entorno
                          SAGE_CLIENT_ID y SAGE_CLIENT_SECRET
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Holded Integration */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Holded</h3>
                      {holdedStatus?.integrated ? (
                        <Badge variant="default">✓ Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Demo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {holdedStatus?.description || 'Software de gestión empresarial todo-en-uno'}
                    </p>
                  </div>
                  <Button
                    onClick={() => loadHoldedStatus()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {holdedStatus && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Funcionalidades disponibles:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {holdedStatus.features?.map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleSyncCustomersSystem('holded')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Sincronizar Clientes
                      </Button>
                      <Button
                        onClick={() => handleCreateInvoiceSystem('holded')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Crear Facturas
                      </Button>
                      <Button
                        onClick={() => handleRegisterPaymentsSystem('holded')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagos
                      </Button>
                    </div>

                    {!holdedStatus.integrated && (
                      <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md p-4">
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          <strong>Modo Demo:</strong> Esta integración está en modo demostración.
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                          Para activar la integración real, configura la variable de entorno
                          HOLDED_API_KEY
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* A3 Integration */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">A3 Software</h3>
                      {a3Status?.integrated ? (
                        <Badge variant="default">✓ Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Demo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {a3Status?.description || 'ERP líder en España para pymes'}
                    </p>
                  </div>
                  <Button
                    onClick={() => loadA3Status()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {a3Status && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Funcionalidades disponibles:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {a3Status.features?.map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleSyncCustomersSystem('a3')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Sincronizar Clientes
                      </Button>
                      <Button
                        onClick={() => handleCreateInvoiceSystem('a3')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Crear Facturas
                      </Button>
                      <Button
                        onClick={() => handleRegisterPaymentsSystem('a3')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagos
                      </Button>
                    </div>

                    {!a3Status.integrated && (
                      <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-md p-4">
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                          <strong>Modo Demo:</strong> Esta integración está en modo demostración.
                        </p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                          Para activar la integración real, configura las variables de entorno
                          A3_API_URL, A3_CLIENT_ID y A3_CLIENT_SECRET
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alegra Integration */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Alegra</h3>
                      {alegraStatus?.integrated ? (
                        <Badge variant="default">✓ Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Demo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alegraStatus?.description || 'Facturación líder en Latinoamérica'}
                    </p>
                  </div>
                  <Button
                    onClick={() => loadAlegraStatus()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {alegraStatus && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Funcionalidades disponibles:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {alegraStatus.features?.map((feature: string, idx: number) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleSyncCustomersSystem('alegra')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Sincronizar Clientes
                      </Button>
                      <Button
                        onClick={() => handleCreateInvoiceSystem('alegra')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Crear Facturas
                      </Button>
                      <Button
                        onClick={() => handleRegisterPaymentsSystem('alegra')}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagos
                      </Button>
                    </div>

                    {!alegraStatus.integrated && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Modo Demo:</strong> Esta integración está en modo demostración.
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                          Para activar la integración real, configura las variables de entorno
                          ALEGRA_API_TOKEN y ALEGRA_COMPANY_EMAIL
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Más integraciones disponibles */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>¿Necesitas otra integración?</strong> Consulta la documentación de APIs
                  disponibles o contacta con soporte para más información.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cuenta de Pérdidas y Ganancias */}
        <TabsContent value="pyg" className="space-y-4">
          <p className="text-muted-foreground">Aquí se mostrará la cuenta de pérdidas y ganancias</p>
        </TabsContent>

        <TabsContent value="analitica" className="space-y-4">
          <p className="text-muted-foreground">Aquí se mostrará la contabilidad analítica</p>
        </TabsContent>

        <TabsContent value="centros" className="space-y-4">
          <p className="text-muted-foreground">Aquí se mostrarán los centros de coste</p>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-4">
          <p className="text-muted-foreground">Aquí se mostrará la información fiscal</p>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <p className="text-muted-foreground">Aquí se mostrarán los ratios financieros</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
