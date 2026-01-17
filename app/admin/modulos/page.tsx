'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página redireccionada a /empresa/modulos
 * 
 * La gestión de módulos ahora está en la sección de empresa,
 * ya que es el administrador de la empresa quien debe gestionar
 * qué módulos están activos según su plan o add-ons contratados.
 */
export default function AdminModulosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/empresa/modulos');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirigiendo a gestión de módulos...</p>
      </div>
    </div>
  );
}
