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
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  Calendar,
  Home,
  ArrowLeft,
  Building2,
  User,
  Euro,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  Edit,
  Upload,
  Banknote,
  CreditCard,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

// Tipos
interface Warranty {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  contractId: string;
  amount: number;
  type: 'cash' | 'bank_guarantee' | 'insurance' | 'aval_personal';
  depositDate: string;
  status: 'active' | 'pending_return' | 'returned' | 'deducted' | 'partial_return';
  contractStartDate: string;
  contractEndDate: string;
  returnDate?: string;
  returnedAmount?: number;
  bankName?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  deductions: Array<{
    id: string;
    amount: number;
    reason: string;
    date: string;
    approved: boolean;
    approvedBy?: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contract {
  id: string;
  tenantName: string;
  propertyName: string;
  startDate: string;
  endDate: string;
}

export default function GarantiasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  
  // Formulario nueva garantía
  const [newWarranty, setNewWarranty] = useState({
    contractId: '',
    amount: '',
    type: 'cash' as const,
    depositDate: new Date().toISOString().split('T')[0],
    bankName: '',
    insuranceCompany: '',
    policyNumber: '',
    notes: '',
  });
  
  // Formulario deducción
  const [newDeduction, setNewDeduction] = useState({
    amount: '',
    reason: '',
  });

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
      
      // Cargar garantías (mock data por ahora)
      const mockWarranties: Warranty[] = [
        {
          id: 'w1',
          tenantId: 't1',
          tenantName: 'María García López',
          tenantEmail: 'maria.garcia@email.com',
          propertyId: 'p1',
          propertyName: 'Piso en C/ Mayor 45, 3ºA',
          propertyAddress: 'C/ Mayor 45, 3ºA, Madrid',
          contractId: 'c1',
          amount: 2400,
          type: 'cash',
          depositDate: '2024-01-15',
          status: 'active',
          contractStartDate: '2024-01-15',
          contractEndDate: '2026-01-15',
          documents: [
            { id: 'd1', name: 'Recibo de fianza.pdf', type: 'pdf', url: '/docs/d1', uploadedAt: '2024-01-15' },
          ],
          deductions: [],
          notes: 'Fianza equivalente a 2 meses de renta',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: 'w2',
          tenantId: 't2',
          tenantName: 'Juan Martínez Ruiz',
          tenantEmail: 'juan.martinez@email.com',
          propertyId: 'p2',
          propertyName: 'Apartamento Playa, Bloque 2-4B',
          propertyAddress: 'Av. del Mar 23, Bloque 2-4B, Valencia',
          contractId: 'c2',
          amount: 1500,
          type: 'bank_guarantee',
          depositDate: '2023-06-01',
          status: 'active',
          contractStartDate: '2023-06-01',
          contractEndDate: '2025-06-01',
          bankName: 'BBVA',
          documents: [
            { id: 'd2', name: 'Aval bancario BBVA.pdf', type: 'pdf', url: '/docs/d2', uploadedAt: '2023-06-01' },
          ],
          deductions: [],
          createdAt: '2023-06-01',
          updatedAt: '2023-06-01',
        },
        {
          id: 'w3',
          tenantId: 't3',
          tenantName: 'Ana Rodríguez Pérez',
          tenantEmail: 'ana.rodriguez@email.com',
          propertyId: 'p3',
          propertyName: 'Estudio Centro, 1ºB',
          propertyAddress: 'C/ Gran Vía 10, 1ºB, Madrid',
          contractId: 'c3',
          amount: 900,
          type: 'insurance',
          depositDate: '2024-03-01',
          status: 'pending_return',
          contractStartDate: '2024-03-01',
          contractEndDate: '2025-03-01',
          insuranceCompany: 'Mapfre',
          policyNumber: 'POL-2024-12345',
          documents: [
            { id: 'd3', name: 'Póliza seguro caución.pdf', type: 'pdf', url: '/docs/d3', uploadedAt: '2024-03-01' },
          ],
          deductions: [
            {
              id: 'ded1',
              amount: 150,
              reason: 'Reparación pared dañada en salón',
              date: '2025-01-15',
              approved: true,
              approvedBy: 'Admin',
            },
          ],
          notes: 'Contrato finalizado, pendiente inspección final',
          createdAt: '2024-03-01',
          updatedAt: '2025-01-15',
        },
        {
          id: 'w4',
          tenantId: 't4',
          tenantName: 'Carlos Fernández',
          tenantEmail: 'carlos.f@email.com',
          propertyId: 'p4',
          propertyName: 'Ático Zona Norte',
          propertyAddress: 'C/ Serrano 120, Ático, Madrid',
          contractId: 'c4',
          amount: 3000,
          type: 'cash',
          depositDate: '2022-09-01',
          status: 'returned',
          contractStartDate: '2022-09-01',
          contractEndDate: '2024-09-01',
          returnDate: '2024-09-15',
          returnedAmount: 3000,
          documents: [
            { id: 'd4', name: 'Recibo fianza.pdf', type: 'pdf', url: '/docs/d4', uploadedAt: '2022-09-01' },
            { id: 'd5', name: 'Justificante devolución.pdf', type: 'pdf', url: '/docs/d5', uploadedAt: '2024-09-15' },
          ],
          deductions: [],
          createdAt: '2022-09-01',
          updatedAt: '2024-09-15',
        },
      ];
      
      setWarranties(mockWarranties);
      
      // Cargar contratos para selector
      setContracts([
        { id: 'c1', tenantName: 'María García', propertyName: 'C/ Mayor 45', startDate: '2024-01-15', endDate: '2026-01-15' },
        { id: 'c5', tenantName: 'Pedro Sánchez', propertyName: 'C/ Alcalá 89', startDate: '2025-01-01', endDate: '2027-01-01' },
      ]);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar las garantías');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar garantías
  const filteredWarranties = warranties.filter(w => {
    const matchesSearch = 
      w.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    const matchesType = filterType === 'all' || w.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Estadísticas
  const stats = {
    total: warranties.length,
    totalAmount: warranties.filter(w => w.status === 'active').reduce((sum, w) => sum + w.amount, 0),
    active: warranties.filter(w => w.status === 'active').length,
    pendingReturn: warranties.filter(w => w.status === 'pending_return').length,
    returned: warranties.filter(w => w.status === 'returned').length,
    totalDeductions: warranties.reduce((sum, w) => 
      sum + w.deductions.reduce((s, d) => s + d.amount, 0), 0
    ),
  };

  // Badges de estado
  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string; icon: any }> = {
      active: { className: 'bg-green-500 hover:bg-green-600', label: 'Activa', icon: CheckCircle },
      pending_return: { className: 'bg-yellow-500 hover:bg-yellow-600', label: 'Pendiente Devolución', icon: Clock },
      returned: { className: 'bg-blue-500 hover:bg-blue-600', label: 'Devuelta', icon: CheckCircle },
      deducted: { className: 'bg-red-500 hover:bg-red-600', label: 'Deducida', icon: AlertCircle },
      partial_return: { className: 'bg-orange-500 hover:bg-orange-600', label: 'Devolución Parcial', icon: AlertTriangle },
    };
    const { className, label, icon: Icon } = config[status] || config.active;
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Badges de tipo
  const getTypeBadge = (type: string) => {
    const config: Record<string, { className: string; label: string; icon: any }> = {
      cash: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Efectivo', icon: Banknote },
      bank_guarantee: { className: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Aval Bancario', icon: CreditCard },
      insurance: { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Seguro Caución', icon: ShieldCheck },
      aval_personal: { className: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Aval Personal', icon: User },
    };
    const { className, label, icon: Icon } = config[type] || config.cash;
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calcular importe a devolver
  const getReturnAmount = (warranty: Warranty) => {
    const totalDeductions = warranty.deductions.reduce((sum, d) => sum + d.amount, 0);
    return warranty.amount - totalDeductions;
  };

  // Crear nueva garantía
  const handleCreateWarranty = async () => {
    if (!newWarranty.contractId || !newWarranty.amount) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    
    try {
      // Aquí iría la llamada a la API
      toast.success('Garantía registrada correctamente');
      setShowNewDialog(false);
      setNewWarranty({
        contractId: '',
        amount: '',
        type: 'cash',
        depositDate: new Date().toISOString().split('T')[0],
        bankName: '',
        insuranceCompany: '',
        policyNumber: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la garantía');
    }
  };

  // Añadir deducción
  const handleAddDeduction = async () => {
    if (!selectedWarranty || !newDeduction.amount || !newDeduction.reason) {
      toast.error('Completa todos los campos');
      return;
    }
    
    try {
      // Aquí iría la llamada a la API
      toast.success('Deducción añadida correctamente');
      setShowDeductionDialog(false);
      setNewDeduction({ amount: '', reason: '' });
      loadData();
    } catch (error) {
      toast.error('Error al añadir la deducción');
    }
  };

  // Procesar devolución
  const handleProcessReturn = async () => {
    if (!selectedWarranty) return;
    
    try {
      // Aquí iría la llamada a la API
      toast.success('Devolución procesada correctamente');
      setShowReturnDialog(false);
      loadData();
    } catch (error) {
      toast.error('Error al procesar la devolución');
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando garantías...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Garantías</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Garantías</h1>
              <p className="text-muted-foreground">
                Control de fianzas, avales y devoluciones
              </p>
            </div>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Garantía
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Garantía</DialogTitle>
                <DialogDescription>
                  Registra una nueva fianza o aval para un contrato
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Contrato *</Label>
                  <Select 
                    value={newWarranty.contractId}
                    onValueChange={(v) => setNewWarranty({ ...newWarranty, contractId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.tenantName} - {c.propertyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Importe (€) *</Label>
                    <Input
                      type="number"
                      placeholder="1200"
                      value={newWarranty.amount}
                      onChange={(e) => setNewWarranty({ ...newWarranty, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select 
                      value={newWarranty.type}
                      onValueChange={(v: any) => setNewWarranty({ ...newWarranty, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="bank_guarantee">Aval Bancario</SelectItem>
                        <SelectItem value="insurance">Seguro Caución</SelectItem>
                        <SelectItem value="aval_personal">Aval Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Fecha de Depósito</Label>
                  <Input
                    type="date"
                    value={newWarranty.depositDate}
                    onChange={(e) => setNewWarranty({ ...newWarranty, depositDate: e.target.value })}
                  />
                </div>
                
                {newWarranty.type === 'bank_guarantee' && (
                  <div className="space-y-2">
                    <Label>Entidad Bancaria</Label>
                    <Input
                      placeholder="BBVA, Santander, CaixaBank..."
                      value={newWarranty.bankName}
                      onChange={(e) => setNewWarranty({ ...newWarranty, bankName: e.target.value })}
                    />
                  </div>
                )}
                
                {newWarranty.type === 'insurance' && (
                  <>
                    <div className="space-y-2">
                      <Label>Compañía Aseguradora</Label>
                      <Input
                        placeholder="Mapfre, Allianz..."
                        value={newWarranty.insuranceCompany}
                        onChange={(e) => setNewWarranty({ ...newWarranty, insuranceCompany: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número de Póliza</Label>
                      <Input
                        placeholder="POL-2025-XXXXX"
                        value={newWarranty.policyNumber}
                        onChange={(e) => setNewWarranty({ ...newWarranty, policyNumber: e.target.value })}
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    value={newWarranty.notes}
                    onChange={(e) => setNewWarranty({ ...newWarranty, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateWarranty}>
                  Registrar Garantía
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Garantías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.active} activas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Importe Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">En garantías activas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes Devolución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingReturn}</div>
              <p className="text-xs text-muted-foreground">Requieren procesamiento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Deducciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</div>
              <p className="text-xs text-muted-foreground">Por daños/impagos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por inquilino o propiedad..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="pending_return">Pendiente devolución</SelectItem>
                  <SelectItem value="returned">Devueltas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="bank_guarantee">Aval Bancario</SelectItem>
                  <SelectItem value="insurance">Seguro Caución</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Garantías */}
        <div className="space-y-4">
          {filteredWarranties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron garantías</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Intenta con otros filtros de búsqueda'
                    : 'Comienza registrando tu primera garantía'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Garantía
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredWarranties.map((warranty) => (
              <Card key={warranty.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg shrink-0">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                          {warranty.tenantName}
                          {getStatusBadge(warranty.status)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {warranty.propertyName}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(warranty.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedWarranty(warranty)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          {warranty.status === 'active' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedWarranty(warranty);
                              setShowDeductionDialog(true);
                            }}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Añadir deducción
                            </DropdownMenuItem>
                          )}
                          {warranty.status === 'pending_return' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedWarranty(warranty);
                              setShowReturnDialog(true);
                            }}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Procesar devolución
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Importe</p>
                      <p className="text-lg font-bold">{formatCurrency(warranty.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha Depósito</p>
                      <p className="text-sm font-medium">{formatDate(warranty.depositDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fin Contrato</p>
                      <p className="text-sm font-medium">{formatDate(warranty.contractEndDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">A Devolver</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(getReturnAmount(warranty))}</p>
                    </div>
                  </div>

                  {warranty.deductions.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Deducciones ({warranty.deductions.length})
                      </p>
                      <div className="space-y-2">
                        {warranty.deductions.map((ded) => (
                          <div key={ded.id} className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded">
                            <div>
                              <p className="text-sm font-medium">{ded.reason}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(ded.date)}</p>
                            </div>
                            <p className="text-sm font-bold text-red-600">-{formatCurrency(ded.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {warranty.documents.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos ({warranty.documents.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {warranty.documents.map((doc) => (
                          <Badge key={doc.id} variant="outline" className="cursor-pointer hover:bg-muted">
                            <FileText className="h-3 w-3 mr-1" />
                            {doc.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog Añadir Deducción */}
        <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Deducción</DialogTitle>
              <DialogDescription>
                Registra una deducción por daños o impagos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Importe (€) *</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={newDeduction.amount}
                  onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Motivo *</Label>
                <Textarea
                  placeholder="Describe el motivo de la deducción..."
                  value={newDeduction.reason}
                  onChange={(e) => setNewDeduction({ ...newDeduction, reason: e.target.value })}
                />
              </div>
              {selectedWarranty && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Garantía:</strong> {formatCurrency(selectedWarranty.amount)}
                  </p>
                  <p className="text-sm">
                    <strong>Deducciones previas:</strong> {formatCurrency(
                      selectedWarranty.deductions.reduce((sum, d) => sum + d.amount, 0)
                    )}
                  </p>
                  <p className="text-sm">
                    <strong>Disponible:</strong> {formatCurrency(getReturnAmount(selectedWarranty))}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeductionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDeduction}>
                Añadir Deducción
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Procesar Devolución */}
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Procesar Devolución</DialogTitle>
              <DialogDescription>
                Confirma la devolución de la garantía
              </DialogDescription>
            </DialogHeader>
            {selectedWarranty && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-lg font-bold text-green-700">
                    Importe a devolver: {formatCurrency(getReturnAmount(selectedWarranty))}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Garantía original:</span>
                    <span>{formatCurrency(selectedWarranty.amount)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Total deducciones:</span>
                    <span>-{formatCurrency(
                      selectedWarranty.deductions.reduce((sum, d) => sum + d.amount, 0)
                    )}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-green-600">
                    <span>A devolver:</span>
                    <span>{formatCurrency(getReturnAmount(selectedWarranty))}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Inquilino</Label>
                  <p className="text-sm">{selectedWarranty.tenantName}</p>
                  <p className="text-xs text-muted-foreground">{selectedWarranty.tenantEmail}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleProcessReturn} className="bg-green-600 hover:bg-green-700">
                <DollarSign className="h-4 w-4 mr-2" />
                Confirmar Devolución
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asistente IA de Documentos */}
      <AIDocumentAssistant 
        context="documentos"
        variant="floating"
        position="bottom-right"
        onAnalysisComplete={(analysis, file) => {
          toast.success(`Documento "${file.name}" analizado correctamente`);
        }}
      />
    </AuthenticatedLayout>
  );
}
