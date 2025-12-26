'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-manager';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showToast?: boolean;
  toastMessage?: string;
}

export function CopyButton({
  text,
  label,
  variant = 'ghost',
  size = 'sm',
  className,
  showToast = true,
  toastMessage = 'Copiado al portapapeles',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      if (showToast) {
        toast.success(toastMessage);
      }
      setTimeout(() => setCopied(false), 2000);
    } else {
      if (showToast) {
        toast.error('Error al copiar');
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn('gap-2', className)}
      aria-label={label || 'Copiar al portapapeles'}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {label && 'Copiado'}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
