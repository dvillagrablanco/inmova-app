'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// /comercial/espacios redirige al dashboard comercial que ya muestra espacios por tipo
export default function ComercialEspaciosPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/comercial'); }, [router]);
  return null;
}
