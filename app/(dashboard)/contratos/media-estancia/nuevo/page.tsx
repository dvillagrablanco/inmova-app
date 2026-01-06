'use client';

/**
 * PÁGINA: NUEVO CONTRATO DE MEDIA ESTANCIA
 * 
 * Formulario wizard para crear contratos de alquiler temporal (1-11 meses)
 */

import { useRouter } from 'next/navigation';
import { MediumTermContractWizard } from '@/components/contracts/MediumTermContractWizard';
import { toast } from 'sonner';

export default function NuevoContratoMediaEstanciaPage() {
  const router = useRouter();

  const handleComplete = (contract: any) => {
    toast.success('Contrato de media estancia creado correctamente');
    router.push(`/contratos/${contract.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <MediumTermContractWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
