'use client';

import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  backButton?: boolean;
  backRoute?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  backButton = false,
  backRoute,
  className
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backRoute) {
      router.push(backRoute);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn(
      "flex flex-col gap-4 pb-6 border-b border-gray-200",
      className
    )}>
      {backButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-200">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-2 max-w-2xl">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}