'use client';

/**
 * CONTEXTUAL QUICK ACTIONS
 * Botones de acción rápida que cambian según el contexto de la página
 */

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  MessageSquare,
  Plus,
  Eye,
  Edit,
  Download,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  FileSignature,
  Upload,
  Search,
  UserPlus,
  Clock,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  badge?: string;
  tooltip?: string;
}

interface ContextualQuickActionsProps {
  // Props específicos por página
  propertyId?: string;
  tenantId?: string;
  contractId?: string;
  buildingId?: string;

  // Estado de la entidad
  propertyStatus?: 'ocupada' | 'disponible' | 'en_mantenimiento';
  contractStatus?: 'activo' | 'borrador' | 'vencido';
  tenantStatus?: 'activo' | 'inactivo' | 'moroso';

  // Metadatos adicionales
  daysUntilExpiration?: number;
  pendingPayments?: number;
  hasActiveIncidents?: boolean;
  
  // Nuevos metadatos para Contratos, Pagos, Incidencias
  expiringContracts?: number;
  overduePayments?: number;
  pendingIssues?: number;
  criticalIssues?: number;
  
  // Nuevos metadatos para Candidatos
  newCandidates?: number;
  highScoreCandidates?: number;
  pendingReviewCandidates?: number;
  
  // Nuevos metadatos para Mantenimiento
  pendingMaintenanceRequests?: number;
  urgentMaintenanceRequests?: number;
  upcomingMaintenanceTasks?: number;
}

export function ContextualQuickActions(props: ContextualQuickActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [actions, setActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    const generatedActions = generateActions(pathname, props, router);
    setActions(generatedActions);
  }, [pathname, props, router]);

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
      {actions.map((action, index) => (
        <div key={index} className="flex items-center gap-2">
          <Button
            variant={action.variant || 'default'}
            size="sm"
            onClick={action.onClick}
            className="whitespace-nowrap gap-2"
            title={action.tooltip}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
            {action.badge && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {action.badge}
              </Badge>
            )}
          </Button>
          {index < actions.length - 1 && index === 2 && (
            <Separator orientation="vertical" className="h-6" />
          )}
        </div>
      ))}
    </div>
  );
}

function generateActions(
  pathname: string,
  props: ContextualQuickActionsProps,
  router: any
): QuickAction[] {
  const actions: QuickAction[] = [];

  // ========================================
  // DASHBOARD
  // ========================================
  if (pathname === '/dashboard') {
    actions.push(
      {
        label: 'Nueva Propiedad',
        icon: Plus,
        onClick: () => router.push('/propiedades/crear'),
        variant: 'default',
      },
      {
        label: 'Nuevo Inquilino',
        icon: UserPlus,
        onClick: () => router.push('/inquilinos/nuevo'),
        variant: 'outline',
      },
      {
        label: 'Registrar Pago',
        icon: DollarSign,
        onClick: () => router.push('/pagos/nuevo'),
        variant: 'outline',
        badge: props.pendingPayments ? `${props.pendingPayments}` : undefined,
      }
    );
  }

  // ========================================
  // PROPIEDADES - LISTA
  // ========================================
  if (pathname === '/propiedades') {
    actions.push(
      {
        label: 'Nueva Propiedad',
        icon: Plus,
        onClick: () => router.push('/propiedades/crear'),
        variant: 'default',
      },
      {
        label: 'Buscar',
        icon: Search,
        onClick: () => {
          // Focus en input de búsqueda
          const searchInput = document.querySelector(
            'input[placeholder*="Buscar"]'
          ) as HTMLInputElement;
          searchInput?.focus();
        },
        variant: 'outline',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar a CSV/Excel
        },
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // PROPIEDADES - DETALLES
  // ========================================
  if (pathname.startsWith('/propiedades/') && props.propertyId && pathname !== '/propiedades/crear') {
    // Si la propiedad está OCUPADA
    if (props.propertyStatus === 'ocupada') {
      actions.push(
        {
          label: 'Ver Inquilino',
          icon: Users,
          onClick: () => router.push(`/inquilinos/${props.tenantId}`),
          variant: 'default',
          tooltip: 'Ver perfil del inquilino actual',
        },
        {
          label: 'Registrar Pago',
          icon: DollarSign,
          onClick: () =>
            router.push(`/pagos/nuevo?propertyId=${props.propertyId}`),
          variant: 'outline',
          badge: props.pendingPayments ? `${props.pendingPayments}` : undefined,
        },
        {
          label: 'Chatear',
          icon: MessageSquare,
          onClick: () => router.push(`/chat?tenantId=${props.tenantId}`),
          variant: 'outline',
        }
      );

      // Separator visual
      actions.push({
        label: '',
        icon: () => null,
        onClick: () => {},
        variant: 'ghost',
      } as any);

      actions.push(
        {
          label: 'Reportar Incidencia',
          icon: AlertCircle,
          onClick: () =>
            router.push(`/incidencias/nueva?propertyId=${props.propertyId}`),
          variant: 'ghost',
          badge: props.hasActiveIncidents ? '!' : undefined,
        },
        {
          label: 'Ver Contrato',
          icon: FileText,
          onClick: () => router.push(`/contratos/${props.contractId}`),
          variant: 'ghost',
        },
        {
          label: 'Ver Edificio',
          icon: Building2,
          onClick: () => router.push(`/edificios/${props.buildingId}`),
          variant: 'ghost',
        }
      );
    }

    // Si la propiedad está DISPONIBLE
    if (props.propertyStatus === 'disponible') {
      actions.push(
        {
          label: 'Publicar Anuncio',
          icon: TrendingUp,
          onClick: () =>
            router.push(`/anuncios/nuevo?propertyId=${props.propertyId}`),
          variant: 'default',
          tooltip: 'Publicar en portales inmobiliarios',
        },
        {
          label: 'Buscar Inquilino',
          icon: Search,
          onClick: () => router.push(`/candidatos?propertyId=${props.propertyId}`),
          variant: 'outline',
        },
        {
          label: 'Ver Candidatos',
          icon: Users,
          onClick: () => router.push(`/candidatos?propertyId=${props.propertyId}`),
          variant: 'outline',
        }
      );

      actions.push(
        {
          label: 'Programar Visita',
          icon: Calendar,
          onClick: () =>
            router.push(`/visitas/nueva?propertyId=${props.propertyId}`),
          variant: 'ghost',
        },
        {
          label: 'Ver Edificio',
          icon: Building2,
          onClick: () => router.push(`/edificios/${props.buildingId}`),
          variant: 'ghost',
        }
      );
    }

    // Si está en MANTENIMIENTO
    if (props.propertyStatus === 'en_mantenimiento') {
      actions.push(
        {
          label: 'Ver Incidencias',
          icon: AlertCircle,
          onClick: () =>
            router.push(`/mantenimiento?propertyId=${props.propertyId}`),
          variant: 'default',
          badge: props.hasActiveIncidents ? '!' : undefined,
        },
        {
          label: 'Marcar Disponible',
          icon: Eye,
          onClick: () => {
            // TODO: Cambiar estado
          },
          variant: 'outline',
        }
      );
    }

    // Acciones comunes
    actions.push(
      {
        label: 'Editar',
        icon: Edit,
        onClick: () => router.push(`/propiedades/${props.propertyId}/editar`),
        variant: 'ghost',
      },
      {
        label: 'Documentos',
        icon: FileText,
        onClick: () =>
          router.push(`/documentos?propertyId=${props.propertyId}`),
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // INQUILINOS - LISTA
  // ========================================
  if (pathname === '/inquilinos') {
    actions.push(
      {
        label: 'Nuevo Inquilino',
        icon: UserPlus,
        onClick: () => router.push('/inquilinos/nuevo'),
        variant: 'default',
      },
      {
        label: 'Candidatos',
        icon: Search,
        onClick: () => router.push('/candidatos'),
        variant: 'outline',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar
        },
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // INQUILINOS - DETALLES
  // ========================================
  if (pathname.startsWith('/inquilinos/') && props.tenantId && pathname !== '/inquilinos/nuevo') {
    actions.push(
      {
        label: 'Ver Propiedad',
        icon: Home,
        onClick: () => router.push(`/propiedades/${props.propertyId}`),
        variant: 'default',
        tooltip: 'Ver propiedad donde vive',
      },
      {
        label: 'Registrar Pago',
        icon: DollarSign,
        onClick: () => router.push(`/pagos/nuevo?tenantId=${props.tenantId}`),
        variant: 'outline',
        badge: props.pendingPayments ? `${props.pendingPayments}` : undefined,
      },
      {
        label: 'Enviar Mensaje',
        icon: MessageSquare,
        onClick: () => router.push(`/chat?tenantId=${props.tenantId}`),
        variant: 'outline',
      }
    );

    actions.push(
      {
        label: 'Ver Contrato',
        icon: FileText,
        onClick: () => router.push(`/contratos/${props.contractId}`),
        variant: 'ghost',
      },
      {
        label: 'Historial Pagos',
        icon: Clock,
        onClick: () => router.push(`/pagos?tenantId=${props.tenantId}`),
        variant: 'ghost',
      },
      {
        label: 'Editar',
        icon: Edit,
        onClick: () => router.push(`/inquilinos/${props.tenantId}/editar`),
        variant: 'ghost',
      }
    );

    // Si tiene morosidad
    if (props.tenantStatus === 'moroso') {
      actions.unshift({
        label: 'Enviar Recordatorio',
        icon: Mail,
        onClick: () => {
          // TODO: Enviar email
        },
        variant: 'destructive',
      });
    }
  }

  // ========================================
  // CONTRATOS - DETALLES
  // ========================================
  if (pathname.startsWith('/contratos/') && props.contractId && pathname !== '/contratos/nuevo') {
    if (props.contractStatus === 'borrador') {
      actions.push(
        {
          label: 'Enviar para Firma',
          icon: FileSignature,
          onClick: () => router.push(`/firma-digital/${props.contractId}`),
          variant: 'default',
        },
        {
          label: 'Editar',
          icon: Edit,
          onClick: () => router.push(`/contratos/${props.contractId}/editar`),
          variant: 'outline',
        }
      );
    }

    if (props.contractStatus === 'activo') {
      actions.push(
        {
          label: 'Ver Inquilino',
          icon: Users,
          onClick: () => router.push(`/inquilinos/${props.tenantId}`),
          variant: 'default',
        },
        {
          label: 'Ver Propiedad',
          icon: Home,
          onClick: () => router.push(`/propiedades/${props.propertyId}`),
          variant: 'outline',
        },
        {
          label: 'Registrar Pago',
          icon: DollarSign,
          onClick: () => router.push(`/pagos/nuevo?contractId=${props.contractId}`),
          variant: 'outline',
        }
      );

      // Si está por vencer
      if (props.daysUntilExpiration && props.daysUntilExpiration <= 30) {
        actions.unshift({
          label: `Renovar (${props.daysUntilExpiration}d)`,
          icon: Clock,
          onClick: () =>
            router.push(`/contratos/nuevo?renovacionDeId=${props.contractId}`),
          variant: 'destructive',
        });
      }
    }

    actions.push(
      {
        label: 'Descargar PDF',
        icon: Download,
        onClick: () => {
          // TODO: Generar y descargar PDF
        },
        variant: 'ghost',
      },
      {
        label: 'Documentos',
        icon: FileText,
        onClick: () => router.push(`/documentos?contractId=${props.contractId}`),
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // CONTRATOS - LISTA (ACTUALIZADO)
  // ========================================
  if (pathname === '/contratos' && !pathname.startsWith('/contratos/')) {
    actions.push(
      {
        label: 'Nuevo Contrato',
        icon: Plus,
        onClick: () => router.push('/contratos/nuevo'),
        variant: 'default',
      },
      {
        label: 'Por Vencer',
        icon: Clock,
        onClick: () => {
          // TODO: Filtrar por vencimiento
        },
        variant: 'outline',
        badge: props.expiringContracts ? `${props.expiringContracts}` : undefined,
        tooltip: 'Contratos que vencen en 30 días',
      },
      {
        label: 'Importar',
        icon: Upload,
        onClick: () => router.push('/contratos/importar'),
        variant: 'ghost',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar contratos
        },
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // PAGOS - LISTA (ACTUALIZADO)
  // ========================================
  if (pathname === '/pagos') {
    actions.push(
      {
        label: 'Registrar Pago',
        icon: Plus,
        onClick: () => router.push('/pagos/nuevo'),
        variant: 'default',
      },
      {
        label: 'Pendientes',
        icon: AlertCircle,
        onClick: () => {
          // TODO: Filtrar pendientes
        },
        variant: 'outline',
        badge: props.pendingPayments ? `${props.pendingPayments}` : undefined,
      },
      {
        label: 'Vencidos',
        icon: Clock,
        onClick: () => {
          // TODO: Filtrar vencidos
        },
        variant: 'outline',
        badge: props.overduePayments ? `${props.overduePayments}` : undefined,
        tooltip: 'Pagos vencidos',
      },
      {
        label: 'Recordatorios',
        icon: Mail,
        onClick: () => {
          // TODO: Enviar emails masivos
        },
        variant: 'ghost',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar pagos
        },
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // INCIDENCIAS - LISTA
  // ========================================
  if (pathname === '/incidencias') {
    actions.push(
      {
        label: 'Nueva Incidencia',
        icon: Plus,
        onClick: () => {
          // Trigger dialog de nueva incidencia
          const event = new CustomEvent('open-new-incidencia-dialog');
          window.dispatchEvent(event);
        },
        variant: 'default',
      },
      {
        label: 'Pendientes',
        icon: Clock,
        onClick: () => {
          // TODO: Filtrar pendientes
        },
        variant: 'outline',
        badge: props.pendingIssues ? `${props.pendingIssues}` : undefined,
        tooltip: 'Incidencias pendientes',
      },
      {
        label: 'Críticas',
        icon: AlertCircle,
        onClick: () => {
          // TODO: Filtrar críticas
        },
        variant: 'outline',
        badge: props.criticalIssues ? `${props.criticalIssues}` : undefined,
        tooltip: 'Incidencias de alta prioridad',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar incidencias
        },
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // CANDIDATOS - LISTA
  // ========================================
  if (pathname === '/candidatos') {
    actions.push(
      {
        label: 'Nuevo Candidato',
        icon: Plus,
        onClick: () => router.push('/candidatos/nuevo'),
        variant: 'default',
      },
      {
        label: 'Nuevos',
        icon: Users,
        onClick: () => {
          // TODO: Filtrar nuevos
        },
        variant: 'outline',
        badge: props.newCandidates ? `${props.newCandidates}` : undefined,
        tooltip: 'Candidatos nuevos',
      },
      {
        label: 'Alto Score',
        icon: TrendingUp,
        onClick: () => {
          // TODO: Filtrar por scoring alto
        },
        variant: 'outline',
        badge: props.highScoreCandidates ? `${props.highScoreCandidates}` : undefined,
        tooltip: 'Candidatos con scoring ≥ 80',
      },
      {
        label: 'En Revisión',
        icon: Clock,
        onClick: () => {
          // TODO: Filtrar en revisión
        },
        variant: 'outline',
        badge: props.pendingReviewCandidates ? `${props.pendingReviewCandidates}` : undefined,
        tooltip: 'Candidatos pendientes de revisión',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar candidatos
        },
        variant: 'ghost',
      }
    );
  }

  // ========================================
  // MANTENIMIENTO - LISTA
  // ========================================
  if (pathname === '/mantenimiento') {
    actions.push(
      {
        label: 'Nueva Solicitud',
        icon: Plus,
        onClick: () => router.push('/mantenimiento/nueva'),
        variant: 'default',
      },
      {
        label: 'Pendientes',
        icon: Clock,
        onClick: () => {
          // TODO: Cambiar a tab de solicitudes + filtrar pendientes
        },
        variant: 'outline',
        badge: props.pendingMaintenanceRequests ? `${props.pendingMaintenanceRequests}` : undefined,
        tooltip: 'Solicitudes pendientes',
      },
      {
        label: 'Urgentes',
        icon: AlertCircle,
        onClick: () => {
          // TODO: Filtrar urgentes
        },
        variant: 'outline',
        badge: props.urgentMaintenanceRequests ? `${props.urgentMaintenanceRequests}` : undefined,
        tooltip: 'Solicitudes urgentes',
      },
      {
        label: 'Próximos',
        icon: Calendar,
        onClick: () => {
          // TODO: Cambiar a tab preventivo
        },
        variant: 'outline',
        badge: props.upcomingMaintenanceTasks ? `${props.upcomingMaintenanceTasks}` : undefined,
        tooltip: 'Mantenimiento preventivo próximo',
      },
      {
        label: 'Exportar',
        icon: Download,
        onClick: () => {
          // TODO: Exportar solicitudes
        },
        variant: 'ghost',
      }
    );
  }

  return actions;
}
