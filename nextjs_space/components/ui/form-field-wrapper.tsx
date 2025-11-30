'use client';

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { cn } from '@/lib/utils';

interface FormFieldWrapperProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  tooltip?: string | ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  label,
  htmlFor,
  required = false,
  tooltip,
  error,
  children,
  className
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      {children}
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}