'use client';

/**
 * Página de Selección de Nivel de Experiencia
 * 
 * Segunda pantalla del onboarding donde el usuario indica
 * su nivel de experiencia con plataformas inmobiliarias.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  GraduationCap,
  Award,
  ArrowRight,
  ArrowLeft,
  Check,
  Lightbulb,
  Rocket,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ExperienceLevel } from '@/lib/onboarding-config';
import { cn } from '@/lib/utils';

interface ExperienceOption {
  id: ExperienceLevel;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onboardingStyle: string;
  features: string[];
}

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    id: 'principiante',
    title: 'Soy nuevo en esto',
    description: 'Es mi primera vez gestionando propiedades o usando software inmobiliario.',
    icon: Lightbulb,
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    onboardingStyle: 'Tutorial completo paso a paso',
    features: [
      'Tour guiado por cada sección',
      'Videos explicativos',
      'Consejos contextuales',
      'Soporte de chat integrado',
    ],
  },
  {
    id: 'intermedio',
    title: 'Tengo algo de experiencia',
    description: 'He gestionado propiedades antes pero quiero mejorar mi proceso.',
    icon: Rocket,
    color: 'bg-green-100 text-green-600 border-green-200',
    onboardingStyle: 'Configuración rápida con tips',
    features: [
      'Configuración guiada',
      'Importación de datos',
      'Atajos de teclado',
      'Tips de productividad',
    ],
  },
  {
    id: 'avanzado',
    title: 'Soy un profesional',
    description: 'Gestiono múltiples propiedades y busco herramientas avanzadas.',
    icon: Crown,
    color: 'bg-purple-100 text-purple-600 border-purple-200',
    onboardingStyle: 'Acceso directo a funciones avanzadas',
    features: [
      'API y automatizaciones',
      'Integraciones',
      'Reportes personalizados',
      'Multi-empresa',
    ],
  },
];

export default function ExperiencePage() {
  const router = useRouter();
  const { update } = useSession();
  
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleContinue = async () => {
    if (!selectedLevel) return;
    
    setIsSubmitting(true);
    
    try {
      // Guardar nivel de experiencia
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceLevel: selectedLevel }),
      });
      
      // Actualizar sesión
      await update({ experienceLevel: selectedLevel });
      
      // Redirigir al onboarding personalizado
      router.push('/onboarding/start');
    } catch (error) {
      console.error('Error saving experience level:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedOption = selectedLevel 
    ? EXPERIENCE_OPTIONS.find(o => o.id === selectedLevel)
    : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Paso 2 de 3</span>
            <span className="text-sm text-muted-foreground">Tu experiencia</span>
          </div>
          <Progress value={66} className="h-2" />
        </div>
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            ¿Cuál es tu nivel de experiencia?
          </h1>
          <p className="text-lg text-muted-foreground">
            Adaptaremos la plataforma y el tutorial a tu nivel de conocimiento.
          </p>
        </div>
        
        {/* Opciones */}
        <div className="space-y-4 mb-8">
          {EXPERIENCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedLevel === option.id;
            
            return (
              <Card 
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary shadow-md",
                )}
                onClick={() => setSelectedLevel(option.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border",
                      option.color
                    )}>
                      <Icon className="h-7 w-7" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {option.title}
                        </h3>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {option.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {option.onboardingStyle}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Detalle seleccionado */}
        {selectedOption && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-3">
                Tu experiencia incluirá:
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedOption.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Acciones */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost"
            onClick={() => router.push('/profile-selection')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <Button 
            size="lg"
            disabled={!selectedLevel || isSubmitting}
            onClick={handleContinue}
          >
            {isSubmitting ? 'Guardando...' : 'Comenzar configuración'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
