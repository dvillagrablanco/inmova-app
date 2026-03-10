'use client';

/**
 * Página de Selección de Necesidades
 *
 * Paso 3 del onboarding: el usuario selecciona qué funcionalidades necesita (multiselect).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  FileSignature,
  Calculator,
  Receipt,
  UserCheck,
  ArrowLeftRight,
  Bell,
  Globe,
  TrendingUp,
  MessageSquare,
  Wrench,
  Zap,
  CalendarCheck,
  LayoutDashboard,
  Banknote,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type NeedId =
  | 'centralizar_info'
  | 'contratos'
  | 'contabilidad'
  | 'facturas'
  | 'solvencia'
  | 'conciliacion'
  | 'recordatorios'
  | 'portales'
  | 'rentabilidad'
  | 'comunicacion'
  | 'incidencias'
  | 'suministros'
  | 'reservas'
  | 'portales_portal'
  | 'liquidaciones';

interface NeedOption {
  id: NeedId;
  title: string;
  icon: React.ElementType;
}

const NEED_OPTIONS: NeedOption[] = [
  { id: 'centralizar_info', title: 'Centralizar información de alquileres', icon: Database },
  { id: 'contratos', title: 'Crear y firmar contratos', icon: FileSignature },
  { id: 'contabilidad', title: 'Generar contabilidad', icon: Calculator },
  { id: 'facturas', title: 'Generar facturas y recibos', icon: Receipt },
  { id: 'solvencia', title: 'Verificar solvencia de inquilinos', icon: UserCheck },
  { id: 'conciliacion', title: 'Conciliar ingresos y gastos', icon: ArrowLeftRight },
  { id: 'recordatorios', title: 'Recordatorios de vencimientos e impagos', icon: Bell },
  { id: 'portales', title: 'Publicar en portales inmobiliarios', icon: Globe },
  { id: 'rentabilidad', title: 'Calcular rentabilidad', icon: TrendingUp },
  { id: 'comunicacion', title: 'Centralizar comunicación', icon: MessageSquare },
  { id: 'incidencias', title: 'Gestionar incidencias', icon: Wrench },
  { id: 'suministros', title: 'Gestionar suministros', icon: Zap },
  { id: 'reservas', title: 'Gestionar reservas', icon: CalendarCheck },
  { id: 'portales_portal', title: 'Portales para inquilinos y propietarios', icon: LayoutDashboard },
  { id: 'liquidaciones', title: 'Liquidaciones a propietarios', icon: Banknote },
];

export default function NeedsPage() {
  const router = useRouter();
  const [selectedNeeds, setSelectedNeeds] = useState<NeedId[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleNeed = (id: NeedId) => {
    setSelectedNeeds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedNeeds.length === 0) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/user/onboarding-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs: selectedNeeds }),
      });

      if (!res.ok) throw new Error('Error guardando preferencias');

      router.push('/onboarding/experience');
    } catch (error) {
      console.error('Error saving needs:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Paso 3 de 5</span>
            <span className="text-sm text-muted-foreground">Tus necesidades</span>
          </div>
          <Progress value={60} className="h-2" />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            ¿Qué necesitas gestionar?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona todo lo que aplique. Personalizaremos tu experiencia.
          </p>
        </div>

        {/* Grid de opciones (checkbox cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {NEED_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedNeeds.includes(option.id);

            return (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-primary shadow-md border-primary'
                )}
                onClick={() => toggleNeed(option.id)}
              >
                <CardContent className="p-4 relative">
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border bg-muted/50">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-semibold">{option.title}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contador y acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {selectedNeeds.length} funcionalidad{selectedNeeds.length !== 1 ? 'es' : ''} seleccionada
            {selectedNeeds.length !== 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              Volver
            </Button>

            <Button
              size="lg"
              disabled={selectedNeeds.length === 0 || isSubmitting}
              onClick={handleContinue}
            >
              {isSubmitting ? 'Guardando...' : 'Continuar'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
