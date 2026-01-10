'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PropiedadesNuevoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página de crear que tiene el formulario completo
    router.replace('/propiedades/crear');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
