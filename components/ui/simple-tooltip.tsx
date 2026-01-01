'use client';

/**
 * TOOLTIP SIMPLIFICADO
 * Explicaciones claras sin jerga técnica
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleTooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showIcon?: boolean;
  maxWidth?: number;
}

export function SimpleTooltip({
  content,
  children,
  side = 'top',
  showIcon = true,
  maxWidth = 300
}: SimpleTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children || (
            <button className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <HelpCircle size={16} />
            </button>
          )}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className={cn(
              'z-50 overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-xl',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
            <TooltipPrimitive.Arrow className="fill-white" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/**
 * Variante con título y descripción
 */
interface RichTooltipProps {
  title: string;
  description: string;
  example?: string;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function RichTooltip({
  title,
  description,
  example,
  children,
  side = 'top'
}: RichTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children || (
            <button className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <HelpCircle size={16} />
            </button>
          )}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className={cn(
              'z-50 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
            )}
          >
            <div className="p-4 space-y-2">
              <h4 className="font-semibold text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              {example && (
                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                  <p className="text-xs text-blue-800">
                    <strong>Ejemplo:</strong> {example}
                  </p>
                </div>
              )}
            </div>
            <TooltipPrimitive.Arrow className="fill-white" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/**
 * Tooltips predefinidos con textos claros
 */
export const CommonTooltips = {
  // Dashboard
  monthlyIncome: {
    title: 'Ingresos Mensuales',
    description: 'Todo el dinero que has cobrado este mes de alquileres, rentas y otros pagos.',
    example: 'Si cobras 5 pisos a 800€ cada uno, aquí verás 4,000€'
  },
  occupancyRate: {
    title: 'Tasa de Ocupación',
    description: 'Porcentaje de tus propiedades que están alquiladas actualmente.',
    example: 'Si tienes 10 pisos y 8 están ocupados, tu tasa es 80%'
  },
  defaultRate: {
    title: 'Tasa de Morosidad',
    description: 'Porcentaje de inquilinos que tienen pagos atrasados.',
    example: 'Si 2 de 10 inquilinos deben dinero, tu tasa es 20%'
  },
  
  // Propiedades
  squareMeters: {
    title: 'Metros Cuadrados',
    description: 'Tamaño total de la propiedad incluyendo todas las habitaciones.',
    example: '80m² es un piso de 3 habitaciones típico'
  },
  energyCertificate: {
    title: 'Certificado Energético',
    description: 'Calificación oficial de eficiencia energética de A (mejor) a G (peor).',
    example: 'Una calificación B significa facturas de luz/gas moderadas'
  },
  
  // Contratos
  deposit: {
    title: 'Fianza',
    description: 'Dinero que el inquilino deja como garantía, generalmente 1-2 meses de alquiler.',
    example: 'Si el alquiler es 800€, la fianza suele ser 800€ o 1,600€'
  },
  duration: {
    title: 'Duración del Contrato',
    description: 'Tiempo que el inquilino se compromete a quedarse, mínimo legal 1 año.',
    example: 'Típicamente se firman contratos de 1 año renovables'
  },
  
  // Pagos
  pending: {
    title: 'Pagos Pendientes',
    description: 'Dinero que aún no has cobrado pero que te deben.',
    example: 'Alquileres del mes actual que vencen en los próximos días'
  },
  overdue: {
    title: 'Pagos Vencidos',
    description: 'Dinero que ya deberías haber cobrado pero que está atrasado.',
    example: 'Un alquiler que vencía el día 5 y estamos a día 15'
  }
};
