'use client';

/**
 * Página de Selección de Perfil de Cliente
 * 
 * Primera pantalla del onboarding donde el usuario selecciona
 * qué tipo de negocio inmobiliario tiene.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Home,
  Building2,
  Briefcase,
  Building,
  HardHat,
  Hotel,
  Plane,
  Landmark,
  Users,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CLIENT_PROFILES, 
  ClientProfile,
  SUBSCRIPTION_PLANS,
} from '@/lib/subscription-plans-config';
import { cn } from '@/lib/utils';

// Iconos por perfil
const PROFILE_ICONS: Record<ClientProfile, React.ElementType> = {
  propietario_individual: Home,
  inversor_pequeno: Building2,
  gestor_profesional: Briefcase,
  agencia_inmobiliaria: Building,
  administrador_fincas: Users,
  promotor_inmobiliario: HardHat,
  empresa_coliving: Hotel,
  empresa_str: Plane,
  fondo_inversion: Landmark,
};

// Colores por perfil
const PROFILE_COLORS: Record<ClientProfile, string> = {
  propietario_individual: 'bg-blue-100 text-blue-600 border-blue-200',
  inversor_pequeno: 'bg-green-100 text-green-600 border-green-200',
  gestor_profesional: 'bg-purple-100 text-purple-600 border-purple-200',
  agencia_inmobiliaria: 'bg-amber-100 text-amber-600 border-amber-200',
  administrador_fincas: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  promotor_inmobiliario: 'bg-orange-100 text-orange-600 border-orange-200',
  empresa_coliving: 'bg-pink-100 text-pink-600 border-pink-200',
  empresa_str: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  fondo_inversion: 'bg-rose-100 text-rose-600 border-rose-200',
};

export default function ProfileSelectionPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleContinue = async () => {
    if (!selectedProfile) return;
    
    setIsSubmitting(true);
    
    try {
      // Guardar perfil en la sesión/BD
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientProfile: selectedProfile }),
      });
      
      // Actualizar sesión
      await update({ clientProfile: selectedProfile });
      
      // Redirigir al siguiente paso del onboarding
      router.push('/onboarding/experience');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedProfileData = selectedProfile 
    ? CLIENT_PROFILES[selectedProfile]
    : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Paso 1 de 3</span>
            <span className="text-sm text-muted-foreground">Configuración inicial</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            ¿Qué tipo de negocio inmobiliario tienes?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Esto nos ayudará a personalizar tu experiencia y mostrarte 
            las funcionalidades más relevantes para ti.
          </p>
        </div>
        
        {/* Grid de Perfiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(CLIENT_PROFILES).map(([key, profile]) => {
            const profileId = key as ClientProfile;
            const Icon = PROFILE_ICONS[profileId];
            const isSelected = selectedProfile === profileId;
            
            return (
              <Card 
                key={key}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary shadow-md",
                )}
                onClick={() => setSelectedProfile(profileId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border",
                      PROFILE_COLORS[profileId]
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {profile.name}
                        </h3>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {profile.portfolioRange.max 
                            ? `${profile.portfolioRange.min}-${profile.portfolioRange.max}`
                            : `${profile.portfolioRange.min}+`} propiedades
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Info del perfil seleccionado */}
        {selectedProfileData && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {selectedProfileData.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedProfileData.description}
                  </p>
                  
                  <h4 className="font-medium text-sm mb-2">
                    Tus principales necesidades:
                  </h4>
                  <ul className="space-y-1">
                    {selectedProfileData.primaryNeeds.slice(0, 4).map((need, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {need}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="md:border-l md:pl-6">
                  <h4 className="font-medium text-sm mb-2">
                    Plan recomendado:
                  </h4>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {SUBSCRIPTION_PLANS[selectedProfileData.recommendedPlans[0]].name}
                      </span>
                      <Badge>Recomendado</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {SUBSCRIPTION_PLANS[selectedProfileData.recommendedPlans[0]].description}
                    </p>
                    <p className="text-2xl font-bold">
                      {SUBSCRIPTION_PLANS[selectedProfileData.recommendedPlans[0]].priceMonthly}€
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Acciones */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost"
            onClick={() => router.back()}
          >
            Volver
          </Button>
          
          <Button 
            size="lg"
            disabled={!selectedProfile || isSubmitting}
            onClick={handleContinue}
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        {/* Skip */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿No estás seguro?{' '}
          <button 
            className="underline hover:text-foreground"
            onClick={() => {
              setSelectedProfile('propietario_individual');
              handleContinue();
            }}
          >
            Continuar con configuración básica
          </button>
        </p>
      </div>
    </div>
  );
}
