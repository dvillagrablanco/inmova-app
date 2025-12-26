'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionGuardProps {
  children: ReactNode;
  permission: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';
  fallback?: ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
  disableOnly?: boolean; // Si true, solo deshabilita en lugar de ocultar
}

export function PermissionGuard({
  children,
  permission,
  fallback = null,
  showTooltip = true,
  tooltipMessage = 'No tienes permiso para esta acción',
  disableOnly = false,
}: PermissionGuardProps) {
  const permissions = usePermissions();
  const hasPermission = permissions[permission] as boolean;

  if (hasPermission) {
    return <>{children}</>;
  }

  if (!disableOnly) {
    return <>{fallback}</>;
  }

  // Si disableOnly es true, mostramos el elemento pero deshabilitado
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-block">
              <div className="opacity-50 pointer-events-none">{children}</div>
              <Lock className="h-3 w-3 absolute top-0 right-0 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative inline-block">
      <div className="opacity-50 pointer-events-none">{children}</div>
    </div>
  );
}

// Componente más específico para botones
interface PermissionButtonProps extends PermissionGuardProps {
  onClick?: () => void;
}

export function PermissionButton({
  children,
  permission,
  onClick,
  ...props
}: PermissionButtonProps) {
  const permissions = usePermissions();
  const hasPermission = permissions[permission] as boolean;

  return (
    <PermissionGuard permission={permission} disableOnly={true} {...props}>
      <div
        onClick={hasPermission ? onClick : undefined}
        className={cn(!hasPermission && 'cursor-not-allowed')}
      >
        {children}
      </div>
    </PermissionGuard>
  );
}
