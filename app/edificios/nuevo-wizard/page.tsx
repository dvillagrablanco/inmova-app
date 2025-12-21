"use client";

import { PropertyWizard } from '@/components/wizards/PropertyWizard';
import { useRouter } from 'next/navigation';

/**
 * PÁGINA DE WIZARD DE CREACIÓN DE PROPIEDAD
 * 
 * Ruta: /edificios/nuevo-wizard
 */
export default function PropertyWizardPage() {
  const router = useRouter();

  return (
    <PropertyWizard
      onComplete={(data) => {
        console.log('Propiedad creada:', data);
        router.push('/edificios');
      }}
    />
  );
}
