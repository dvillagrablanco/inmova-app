'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConstruccionIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/construccion/proyectos');
  }, [router]);
  
  return null;
}
