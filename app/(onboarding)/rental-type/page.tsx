'use client';

/**
 * Página de Selección de Tipo de Alquiler
 *
 * Paso 2 del onboarding: el usuario selecciona qué tipo de alquiler gestiona.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  Plane,
  Users,
  Hotel,
  LayoutGrid,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type RentalType =
  | 'larga_duracion'
  | 'media_estancia'
  | 'corta_duracion'
  | 'habitaciones'
  | 'coliving'
  | 'varios';

interface RentalOption {
  id: RentalType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const RENTAL_OPTIONS: RentalOption[] = [
  {
    id: 'larga_duracion',
    title: 'Larga duración',
    description: 'Alquileres residenciales tradicionales con contratos anuales',
    icon: Home,
    color: 'bg-blue-100 text-blue-600 border-blue-200',
  },
  {
    id: 'media_estancia',
    title: 'Media estancia',
    description: 'Estancias temporales, estudiantes, nómadas digitales',
    icon: Calendar,
    color: 'bg-green-100 text-green-600 border-green-200',
  },
  {
    id: 'corta_duracion',
    title: 'Corta duración / Turístico',
    description: 'Alquiler vacacional, Airbnb, booking',
    icon: Plane,
    color: 'bg-amber-100 text-amber-600 border-amber-200',
  },
  {
    id: 'habitaciones',
    title: 'Por habitaciones',
    description: 'Pisos compartidos, alquiler de habitaciones individuales',
    icon: Users,
    color: 'bg-purple-100 text-purple-600 border-purple-200',
  },
  {
    id: 'coliving',
    title: 'Coliving',
    description: 'Espacios de convivencia con servicios compartidos',
    icon: Hotel,
    color: 'bg-pink-100 text-pink-600 border-pink-200',
  },
  {
    id: 'varios',
    title: 'Varios tipos',
    description: 'Gestiono diferentes tipos de alquiler',
    icon: LayoutGrid,
    color: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  },
];

export default function RentalTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<RentalType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/user/onboarding-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalType: selectedType }),
      });

      if (!res.ok) throw new Error('Error guardando preferencias');

      router.push('/onboarding/needs');
    } catch (error) {
      console.error('Error saving rental type:', error);
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
            <span className="text-sm font-medium">Paso 2 de 5</span>
            <span className="text-sm text-muted-foreground">Tipo de alquiler</span>
          </div>
          <Progress value={40} className="h-2" />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            ¿Qué tipo de alquiler gestionas?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona la opción que mejor describe tu actividad principal.
          </p>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {RENTAL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.id;

            return (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-primary shadow-md'
                )}
                onClick={() => setSelectedType(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border',
                        option.color
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{option.title}</h3>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            Volver
          </Button>

          <Button
            size="lg"
            disabled={!selectedType || isSubmitting}
            onClick={handleContinue}
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
