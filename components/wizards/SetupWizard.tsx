'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Home,
  Users,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface SetupData {
  company: {
    name: string;
    type: string;
    email: string;
    phone: string;
  };
  building: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    totalUnits: string;
  };
  units: {
    count: number;
    type: string;
    priceRange: string;
  };
  preferences: {
    autoReminders: boolean;
    aiAssistant: boolean;
    analytics: boolean;
  };
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Información de tu Empresa',
    description: 'Cuéntanos sobre tu negocio inmobiliario',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Tu Primer Edificio',
    description: 'Registra tu primera propiedad',
    icon: Home,
  },
  {
    id: 3,
    title: 'Configuración de Unidades',
    description: 'Define las características de tus unidades',
    icon: Users,
  },
  {
    id: 4,
    title: 'Preferencias y Automatización',
    description: 'Personaliza tu experiencia',
    icon: FileText,
  },
  {
    id: 5,
    title: '¡Todo Listo!',
    description: 'Tu cuenta está configurada',
    icon: CheckCircle,
  },
];

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    company: {
      name: '',
      type: 'individual',
      email: '',
      phone: '',
    },
    building: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      totalUnits: '',
    },
    units: {
      count: 1,
      type: 'apartment',
      priceRange: '',
    },
    preferences: {
      autoReminders: true,
      aiAssistant: true,
      analytics: true,
    },
  });

  const progress = (currentStep / WIZARD_STEPS.length) * 100;
  const currentStepData = WIZARD_STEPS[currentStep - 1];

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Aquí se enviarían los datos al backend
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData),
      });

      if (response.ok) {
        toast.success('¡Configuración completada con éxito! 🎉');
        setTimeout(() => {
          onComplete();
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error('Error al completar la configuración');
      }
    } catch (error) {
      logger.error('Error completing setup:', error);
      toast.error('Hubo un error. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nombre de la Empresa *</Label>
              <Input
                id="companyName"
                value={setupData.company.name}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    company: { ...setupData.company, name: e.target.value },
                  })
                }
                placeholder="Ej: Inmobiliaria García"
              />
            </div>
            <div>
              <Label htmlFor="companyType">Tipo de Negocio *</Label>
              <Select
                value={setupData.company.type}
                onValueChange={(value) =>
                  setSetupData({
                    ...setupData,
                    company: { ...setupData.company, type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Gestor Individual</SelectItem>
                  <SelectItem value="agency">Agencia Inmobiliaria</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                  <SelectItem value="landlord">Propietario Múltiple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="companyEmail">Email de Contacto *</Label>
              <Input
                id="companyEmail"
                type="email"
                value={setupData.company.email}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    company: { ...setupData.company, email: e.target.value },
                  })
                }
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Teléfono</Label>
              <Input
                id="companyPhone"
                value={setupData.company.phone}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    company: { ...setupData.company, phone: e.target.value },
                  })
                }
                placeholder="+34 XXX XXX XXX"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="buildingName">Nombre del Edificio *</Label>
              <Input
                id="buildingName"
                value={setupData.building.name}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    building: { ...setupData.building, name: e.target.value },
                  })
                }
                placeholder="Ej: Edificio Plaza Mayor"
              />
            </div>
            <div>
              <Label htmlFor="buildingAddress">Dirección *</Label>
              <Input
                id="buildingAddress"
                value={setupData.building.address}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    building: { ...setupData.building, address: e.target.value },
                  })
                }
                placeholder="Calle, Número, Piso"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={setupData.building.city}
                  onChange={(e) =>
                    setSetupData({
                      ...setupData,
                      building: { ...setupData.building, city: e.target.value },
                    })
                  }
                  placeholder="Madrid"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Código Postal *</Label>
                <Input
                  id="postalCode"
                  value={setupData.building.postalCode}
                  onChange={(e) =>
                    setSetupData({
                      ...setupData,
                      building: { ...setupData.building, postalCode: e.target.value },
                    })
                  }
                  placeholder="28001"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="totalUnits">Número Total de Unidades *</Label>
              <Input
                id="totalUnits"
                type="number"
                value={setupData.building.totalUnits}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    building: { ...setupData.building, totalUnits: e.target.value },
                  })
                }
                placeholder="10"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Consejo:</strong> Podrás añadir más edificios después. Por ahora,
                registra el principal para comenzar.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="unitsCount">Unidades a Configurar *</Label>
              <Input
                id="unitsCount"
                type="number"
                value={setupData.units.count}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    units: { ...setupData.units, count: parseInt(e.target.value) || 1 },
                  })
                }
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="unitsType">Tipo de Unidades *</Label>
              <Select
                value={setupData.units.type}
                onValueChange={(value) =>
                  setSetupData({
                    ...setupData,
                    units: { ...setupData.units, type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartamentos</SelectItem>
                  <SelectItem value="house">Casas</SelectItem>
                  <SelectItem value="commercial">Locales Comerciales</SelectItem>
                  <SelectItem value="office">Oficinas</SelectItem>
                  <SelectItem value="room">Habitaciones (Co-living)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priceRange">Rango de Precio Mensual (Alquiler)</Label>
              <Input
                id="priceRange"
                value={setupData.units.priceRange}
                onChange={(e) =>
                  setSetupData({
                    ...setupData,
                    units: { ...setupData.units, priceRange: e.target.value },
                  })
                }
                placeholder="Ej: 800-1200€"
              />
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                ✨ Las unidades se crearán automáticamente. Podrás personalizarlas después.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="autoReminders"
                  checked={setupData.preferences.autoReminders}
                  onChange={(e) =>
                    setSetupData({
                      ...setupData,
                      preferences: { ...setupData.preferences, autoReminders: e.target.checked },
                    })
                  }
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="autoReminders" className="font-semibold">
                    Recordatorios Automáticos de Pago
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Envía recordatorios automáticos a inquilinos antes del vencimiento.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="aiAssistant"
                  checked={setupData.preferences.aiAssistant}
                  onChange={(e) =>
                    setSetupData({
                      ...setupData,
                      preferences: { ...setupData.preferences, aiAssistant: e.target.checked },
                    })
                  }
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="aiAssistant" className="font-semibold">
                    Asistente IA 24/7
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activa el chatbot inteligente para soporte automatizado.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={setupData.preferences.analytics}
                  onChange={(e) =>
                    setSetupData({
                      ...setupData,
                      preferences: { ...setupData.preferences, analytics: e.target.checked },
                    })
                  }
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="analytics" className="font-semibold">
                    Análisis y Reportes Automáticos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe reportes semanales con insights de tu negocio.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg mt-6">
              <h4 className="font-semibold text-purple-900 mb-2">🚀 Funcionalidades Activadas:</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                {setupData.preferences.autoReminders && (
                  <li>• Recordatorios de pago automáticos</li>
                )}
                {setupData.preferences.aiAssistant && <li>• Chatbot IA para soporte 24/7</li>}
                {setupData.preferences.analytics && <li>• Dashboard BI con análisis predictivo</li>}
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-6 rounded-full">
                <CheckCircle className="h-24 w-24 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Todo está listo! 🎉</h3>
              <p className="text-gray-600">Tu cuenta de INMOVA ha sido configurada exitosamente.</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3">Próximos pasos sugeridos:</h4>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Explora tu dashboard personalizado
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Añade más detalles a tus unidades
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Registra tu primer inquilino
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Crea tu primer contrato digital
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              {currentStep < 5 ? (
                <currentStepData.icon className="h-6 w-6 text-primary" />
              ) : (
                <Sparkles className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Paso {currentStep} de {WIZARD_STEPS.length}
          </p>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep < WIZARD_STEPS.length ? (
            <Button onClick={handleNext} className="gradient-primary">
              {currentStep === WIZARD_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting} className="gradient-primary">
              {isSubmitting ? 'Procesando...' : 'Ir al Dashboard'}
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
