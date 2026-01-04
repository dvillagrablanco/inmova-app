'use client';

import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { toast } from 'sonner';

export function RestartOnboardingButton() {
  const { resetOnboarding } = useOnboarding();

  const handleClick = () => {
    resetOnboarding();
    toast.success('Tutorial reiniciado. Recarga la página para verlo de nuevo.');
    
    // Recargar después de 1 segundo
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      Ver Tutorial de Nuevo
    </Button>
  );
}
