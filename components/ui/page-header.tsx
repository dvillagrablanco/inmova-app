'use client';

import { ReactNode } from 'react';
import { BackButton } from '@/components/ui/back-button';
import { BreadcrumbAuto } from '@/components/ui/breadcrumb-auto';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  showBreadcrumbs?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  showBackButton = false,
  showBreadcrumbs = true,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {showBreadcrumbs && <BreadcrumbAuto />}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {showBackButton && <BackButton />}

          <div className="flex items-center gap-3">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description && <p className="text-muted-foreground mt-2">{description}</p>}
            </div>
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
