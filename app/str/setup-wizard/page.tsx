"use client";

import { STRWizard } from '@/components/wizards/STRWizard';
import { useRouter } from 'next/navigation';

/**
 * PÁGINA DE WIZARD DE CONFIGURACIÓN STR
 * 
 * Ruta: /str/setup-wizard
 */
export default function STRWizardPage() {
  const router = useRouter();

  return (
    <STRWizard
      onComplete={(data) => {
        router.push('/str');
      }}
    />
  );
}
