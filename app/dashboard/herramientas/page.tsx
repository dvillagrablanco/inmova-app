'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  FileText,
  TrendingUp,
  Building,
  Euro,
  Home,
  PiggyBank,
  Hammer,
  FileDown,
  BookOpen,
  Scale,
  ArrowUpRight,
  Percent,
  Landmark,
} from 'lucide-react';

import { RentalYieldCalculator } from '@/components/calculators/RentalYieldCalculator';
import { MortgageCalculator } from '@/components/calculators/MortgageCalculator';
import { TransactionCostsCalculator } from '@/components/calculators/TransactionCostsCalculator';

type ToolCategory = 'calculadoras' | 'contratos' | 'guias' | 'recursos';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: ToolCategory;
  available: boolean;
  premium?: boolean;
  component?: React.ComponentType;
}

const TOOLS: Tool[] = [
  // Calculadoras
  {
    id: 'rental-yield',
    name: 'Rentabilidad de Alquiler',
    description: 'Calcula ROI, cashflow y rentabilidad neta de inversiones en alquiler',
    icon: TrendingUp,
    category: 'calculadoras',
    available: true,
    component: RentalYieldCalculator,
  },
  {
    id: 'mortgage',
    name: 'Calculadora de Hipoteca',
    description: 'Simula cuotas, TAE y tabla de amortización',
    icon: Building,
    category: 'calculadoras',
    available: true,
    component: MortgageCalculator,
  },
  {
    id: 'transaction-costs',
    name: 'Gastos de Compraventa',
    description: 'Estima impuestos y gastos por CCAA',
    icon: Euro,
    category: 'calculadoras',
    available: true,
    component: TransactionCostsCalculator,
  },
  {
    id: 'rent-increase',
    name: 'Subida IPC / IRAV',
    description: 'Calcula incrementos legales de alquiler',
    icon: Percent,
    category: 'calculadoras',
    available: false,
    premium: true,
  },
  {
    id: 'flipping',
    name: 'Flipping / Reforma',
    description: 'Rentabilidad de operaciones de compra-reforma-venta',
    icon: Hammer,
    category: 'calculadoras',
    available: false,
    premium: true,
  },
  
  // Contratos
  {
    id: 'contract-rental',
    name: 'Contrato de Arrendamiento',
    description: 'Genera contratos de alquiler personalizados',
    icon: FileText,
    category: 'contratos',
    available: false,
    premium: true,
  },
  {
    id: 'contract-room',
    name: 'Contrato de Habitación',
    description: 'Para coliving y alquiler por habitaciones',
    icon: Home,
    category: 'contratos',
    available: false,
    premium: true,
  },
  {
    id: 'inventory',
    name: 'Inventario / Acta Entrega',
    description: 'Checklist de entrega de llaves',
    icon: Scale,
    category: 'contratos',
    available: false,
    premium: true,
  },
  
  // Guías
  {
    id: 'guide-tax',
    name: 'Guía Fiscal Propietarios',
    description: 'IRPF, deducciones y optimización fiscal',
    icon: Landmark,
    category: 'guias',
    available: false,
    premium: true,
  },
  {
    id: 'guide-lau',
    name: 'Resumen LAU',
    description: 'Ley de Arrendamientos Urbanos explicada',
    icon: BookOpen,
    category: 'guias',
    available: false,
    premium: true,
  },
  {
    id: 'guide-screening',
    name: 'Screening de Inquilinos',
    description: 'Cómo verificar y seleccionar inquilinos',
    icon: FileDown,
    category: 'guias',
    available: false,
    premium: true,
  },
];

export default function HerramientasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<string | null>('rental-yield');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('calculadoras');

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const filteredTools = TOOLS.filter(t => t.category === activeCategory);
  const selectedToolData = TOOLS.find(t => t.id === selectedTool);
  const ToolComponent = selectedToolData?.component;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Herramientas</h1>
              <p className="text-muted-foreground">
                Calculadoras, contratos y recursos para inversores inmobiliarios
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            Basado en análisis ZONA3
          </Badge>
        </div>

        {/* Categorías */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ToolCategory)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calculadoras" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculadoras
            </TabsTrigger>
            <TabsTrigger value="contratos" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contratos
            </TabsTrigger>
            <TabsTrigger value="guias" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Guías
            </TabsTrigger>
            <TabsTrigger value="recursos" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Recursos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de herramientas */}
          <div className="lg:col-span-1 space-y-2">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              
              return (
                <Card
                  key={tool.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                  } ${!tool.available ? 'opacity-60' : ''}`}
                  onClick={() => tool.available && setSelectedTool(tool.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-muted'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{tool.name}</h4>
                          {tool.premium && (
                            <Badge variant="secondary" className="text-[10px] px-1">PRO</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {tool.description}
                        </p>
                        {!tool.available && (
                          <p className="text-xs text-amber-600 mt-1">Próximamente</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredTools.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Próximamente en esta categoría
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contenido de la herramienta */}
          <div className="lg:col-span-3">
            {ToolComponent ? (
              <ToolComponent />
            ) : selectedToolData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const Icon = selectedToolData.icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    {selectedToolData.name}
                  </CardTitle>
                  <CardDescription>{selectedToolData.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <PiggyBank className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Disponible próximamente</h3>
                    <p className="text-muted-foreground mb-4">
                      Esta herramienta está en desarrollo y estará disponible pronto
                    </p>
                    {selectedToolData.premium && (
                      <Button>
                        Desbloquear con Plan Pro
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calculator className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Selecciona una herramienta</h3>
                  <p className="text-muted-foreground">
                    Elige una herramienta de la lista para comenzar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info footer */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Herramientas inspiradas en ZONA3</h3>
                <p className="text-sm text-muted-foreground">
                  Estas herramientas están diseñadas para inversores inmobiliarios, inspiradas en las mejores 
                  prácticas del sector. Incluyen calculadoras financieras, plantillas de contratos y guías 
                  educativas para ayudarte a tomar mejores decisiones de inversión.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
