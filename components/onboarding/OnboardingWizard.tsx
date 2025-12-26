'use client';

/**
 * Onboarding Wizard Component
 * Wizard guiado de 5 pasos para nuevos usuarios
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Building2, Home, UserPlus, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA!',
    description: 'Te guiaremos en los primeros pasos',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          INMOVA es la plataforma todo-en-uno para gestión inmobiliaria profesional.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">¿Qué aprenderás en este tutorial?</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Cómo crear tu primer edificio</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Agregar unidades (pisos, locales)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Registrar inquilinos</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Crear contratos de alquiler</span>
            </li>
          </ul>
        </div>
        <p className="text-sm text-gray-500">⏱️ Tiempo estimado: 5 minutos</p>
      </div>
    ),
  },
  {
    id: 'building',
    title: 'Paso 1: Crea tu primer edificio',
    description: 'Los edificios son el contenedor principal de tus propiedades',
    icon: Building2,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3">💡 ¿Qué es un edificio?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Un edificio es una propiedad que contiene una o más unidades. Puede ser:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Un edificio de apartamentos</li>
            <li>• Una casa unifamiliar</li>
            <li>• Un local comercial</li>
            <li>• Una oficina</li>
          </ul>
        </div>

        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Consejo:</strong> Empieza con los datos básicos. Podrás agregar más detalles
            después.
          </p>
        </div>

        <Button className="w-full" size="lg">
          <Building2 className="h-5 w-5 mr-2" />
          Crear mi primer edificio
        </Button>
      </div>
    ),
  },
  {
    id: 'unit',
    title: 'Paso 2: Agrega una unidad',
    description: 'Las unidades son los espacios individuales que alquilas',
    icon: Home,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">🏠 ¿Qué es una unidad?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Una unidad es un espacio individual dentro de un edificio:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Apartamento 1A, 2B, etc.</li>
            <li>• Local comercial</li>
            <li>• Oficina</li>
            <li>• Plaza de garaje</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">Dormitorios</div>
            <div className="text-2xl font-bold text-blue-600">2</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">Superficie</div>
            <div className="text-2xl font-bold text-blue-600">75 m²</div>
          </div>
        </div>

        <Button className="w-full" size="lg">
          <Home className="h-5 w-5 mr-2" />
          Agregar unidad al edificio
        </Button>
      </div>
    ),
  },
  {
    id: 'tenant',
    title: 'Paso 3: Registra un inquilino',
    description: 'Gestiona la información de tus inquilinos',
    icon: UserPlus,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-gray-900 mb-3">👥 Datos del inquilino</h4>
          <p className="text-sm text-gray-600 mb-3">Información básica que necesitarás:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Nombre completo</li>
            <li>• Email y teléfono</li>
            <li>• DNI/NIE (opcional)</li>
            <li>• Documentación (opcional)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>✨ Extra:</strong> INMOVA te permite crear un portal para que tus inquilinos
            puedan:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-700">
            <li>• Ver sus pagos</li>
            <li>• Descargar recibos</li>
            <li>• Reportar incidencias</li>
            <li>• Comunicarse contigo</li>
          </ul>
        </div>

        <Button className="w-full" size="lg">
          <UserPlus className="h-5 w-5 mr-2" />
          Registrar inquilino
        </Button>
      </div>
    ),
  },
  {
    id: 'contract',
    title: 'Paso 4: Crea un contrato',
    description: 'El último paso: vincula inquilino, unidad y condiciones',
    icon: FileText,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <h4 className="font-semibold text-gray-900 mb-3">📄 Contrato de alquiler</h4>
          <p className="text-sm text-gray-600 mb-3">Un contrato vincula:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Inquilino</div>
                <div className="text-xs text-gray-500">Quién alquila</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                <Home className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Unidad</div>
                <div className="text-xs text-gray-500">Qué se alquila</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Condiciones</div>
                <div className="text-xs text-gray-500">Renta, duración, etc.</div>
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full" size="lg">
          <FileText className="h-5 w-5 mr-2" />
          Crear contrato
        </Button>
      </div>
    ),
  },
  {
    id: 'complete',
    title: '¡Felicidades! 🎉',
    description: 'Ya conoces los conceptos básicos',
    icon: CheckCircle2,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 text-center">
          <div className="h-16 w-16 rounded-full bg-green-500 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h4 className="text-2xl font-bold text-gray-900 mb-2">¡Completaste el onboarding!</h4>
          <p className="text-gray-600">Ya estás listo para empezar a gestionar tus propiedades</p>
        </div>

        <div className="space-y-3">
          <div className="bg-white border rounded-lg p-4">
            <h5 className="font-semibold text-gray-900 mb-2">📚 Próximos pasos recomendados:</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Explora el dashboard y los diferentes módulos</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Personaliza las notificaciones en Configuración</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Invita a tu equipo a colaborar</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Consulta la documentación completa</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 ¿Necesitas ayuda?</strong> Usa el chatbot de soporte (abajo a la derecha) o
              escríbenos a soporte@inmova.app
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center',
                  currentStep === STEPS.length - 1 ? 'bg-green-100' : 'bg-blue-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    currentStep === STEPS.length - 1 ? 'text-green-600' : 'text-blue-600'
                  )}
                />
              </div>
              <div>
                <DialogTitle>{step.title}</DialogTitle>
                <DialogDescription>{step.description}</DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Saltar tutorial
            </Button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                Paso {currentStep + 1} de {STEPS.length}
              </span>
              <span>{Math.round(progress)}% completado</span>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="py-6">{step.content}</div>

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            className={cn(currentStep === STEPS.length - 1 && 'bg-green-600 hover:bg-green-700')}
          >
            {currentStep === STEPS.length - 1 ? '¡Empezar!' : 'Siguiente'}
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-2">
          {STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentStep
                  ? 'w-8 bg-blue-600'
                  : index < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-gray-300'
              )}
              aria-label={`Ir al paso ${index + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
