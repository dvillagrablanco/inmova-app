'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /construccion/gantt → Redirige al Gantt del primer proyecto
 * La vista Gantt real está en /construccion/proyectos con viewMode='gantt'
 */
export default function ConstruccionGanttPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/construccion/proyectos');
  }, [router]);
  
  return null;
}
