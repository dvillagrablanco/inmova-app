/**
 * Presets de Empty States con copy consistente e ilustraciones
 * Proporciona configuraciones predefinidas para diferentes contextos
 */

import { LucideIcon } from 'lucide-react';
import {
  Building2,
  Home,
  Users,
  FileText,
  CreditCard,
  Wrench,
  FolderOpen,
  Search,
  PlusCircle,
} from 'lucide-react';
import {
  NoBuildingsIllustration,
  NoUnitsIllustration,
  NoTenantsIllustration,
  NoContractsIllustration,
  NoPaymentsIllustration,
  NoMaintenanceIllustration,
  NoDataIllustration,
  NoSearchResultsIllustration,
} from '@/components/ui/empty-state-illustrations';

export interface EmptyStatePresetConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  illustration?: React.ReactNode;
  helpText?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

/**
 * Presets de Empty States
 */
export const EMPTY_STATE_PRESETS = {
  // ==================== EDIFICIOS ====================
  buildings: {
    icon: <Building2 size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay edificios registrados',
    description:
      'Comienza agregando tu primer edificio para gestionar tus propiedades de manera eficiente.',
    illustration: <NoBuildingsIllustration className="w-full h-auto" />,
    helpText: 'Tip: Puedes importar múltiples edificios desde un archivo Excel',
  },

  buildingsFiltered: {
    icon: <Building2 size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No se encontraron edificios',
    description:
      'No hay edificios que coincidan con tus criterios de búsqueda. Intenta ajustar los filtros o crear un nuevo edificio.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  // ==================== UNIDADES ====================
  units: {
    icon: <Home size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay unidades registradas',
    description:
      'Agrega unidades a tus edificios para comenzar a gestionarlas y alquilarlas.',
    illustration: <NoUnitsIllustration className="w-full h-auto" />,
    helpText: 'Las unidades pueden ser apartamentos, locales comerciales, oficinas, etc.',
  },

  unitsFiltered: {
    icon: <Home size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No se encontraron unidades',
    description:
      'No hay unidades que coincidan con tu búsqueda. Intenta con otros criterios o agrega nuevas unidades.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  unitsInBuilding: {
    icon: <Home size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'Este edificio aún no tiene unidades',
    description:
      'Comienza agregando las unidades que componen este edificio para poder gestionarlas.',
    illustration: <NoUnitsIllustration className="w-full h-auto" />,
  },

  // ==================== INQUILINOS ====================
  tenants: {
    icon: <Users size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay inquilinos registrados',
    description:
      'Añade inquilinos a tu base de datos para poder asignarlos a contratos y gestionar sus pagos.',
    illustration: <NoTenantsIllustration className="w-full h-auto" />,
    helpText: 'Los datos de inquilinos se mantienen seguros y privados',
  },

  tenantsFiltered: {
    icon: <Users size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No se encontraron inquilinos',
    description:
      'No hay inquilinos que coincidan con tu búsqueda. Verifica los filtros aplicados.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  // ==================== CONTRATOS ====================
  contracts: {
    icon: <FileText size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay contratos activos',
    description:
      'Crea tu primer contrato de arrendamiento para comenzar a gestionar tus rentas.',
    illustration: <NoContractsIllustration className="w-full h-auto" />,
    helpText: 'Los contratos se generan automáticamente en formato PDF',
  },

  contractsExpiring: {
    icon: <FileText size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'Sin contratos próximos a vencer',
    description:
      'Todos tus contratos están vigentes. Te notificaremos cuando alguno esté por vencer.',
    illustration: <NoContractsIllustration className="w-full h-auto" />,
  },

  contractsFiltered: {
    icon: <FileText size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No se encontraron contratos',
    description: 'No hay contratos que coincidan con los filtros aplicados.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  // ==================== PAGOS ====================
  payments: {
    icon: <CreditCard size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay pagos registrados',
    description:
      'Los pagos de tus inquilinos aparecerán aquí. El sistema genera automáticamente las cuotas mensuales.',
    illustration: <NoPaymentsIllustration className="w-full h-auto" />,
  },

  paymentsPending: {
    icon: <CreditCard size={64} className="text-gray-400" aria-hidden="true" />,
    title: '¡Excelente! No hay pagos pendientes',
    description: 'Todos los pagos están al día. Sigue así.',
    illustration: <NoPaymentsIllustration className="w-full h-auto" />,
  },

  paymentsFiltered: {
    icon: <CreditCard size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No se encontraron pagos',
    description: 'No hay pagos que coincidan con los criterios de búsqueda.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  // ==================== MANTENIMIENTO ====================
  maintenance: {
    icon: <Wrench size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay solicitudes de mantenimiento',
    description:
      'Las solicitudes de reparaciones y mantenimiento aparecerán aquí. Los inquilinos pueden reportarlas desde su portal.',
    illustration: <NoMaintenanceIllustration className="w-full h-auto" />,
  },

  maintenancePending: {
    icon: <Wrench size={64} className="text-gray-400" aria-hidden="true" />,
    title: '¡Todo en orden! No hay mantenimientos pendientes',
    description: 'Todas las solicitudes de mantenimiento han sido atendidas.',
    illustration: <NoMaintenanceIllustration className="w-full h-auto" />,
  },

  maintenanceFiltered: {
    icon: <Wrench size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No se encontraron solicitudes',
    description: 'No hay solicitudes de mantenimiento que coincidan con los filtros.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  // ==================== GENÉRICO ====================
  noData: {
    icon: <FolderOpen size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'No hay datos disponibles',
    description: 'Aún no hay información para mostrar. Comienza agregando nuevos registros.',
    illustration: <NoDataIllustration className="w-full h-auto" />,
  },

  noSearchResults: {
    icon: <Search size={64} className="text-gray-400" aria-hidden="true" />,
    title: 'Sin resultados',
    description:
      'No encontramos resultados para tu búsqueda. Intenta con otros términos o ajusta los filtros.',
    illustration: <NoSearchResultsIllustration className="w-full h-auto" />,
  },

  error: {
    icon: <AlertTriangle size={64} className="text-red-400" aria-hidden="true" />,
    title: 'Error al cargar datos',
    description:
      'Ocurrió un problema al cargar la información. Por favor, intenta de nuevo.',
    helpText: 'Si el problema persiste, contacta con soporte',
  },
} as const;

// Tipos para TypeScript
export type EmptyStatePresetKey = keyof typeof EMPTY_STATE_PRESETS;

import { AlertTriangle } from 'lucide-react';
