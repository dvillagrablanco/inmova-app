'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PartnersPage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay token guardado
    const token = localStorage.getItem('partnerToken');
    
    if (token) {
      router.push('/partners/dashboard');
    } else {
      router.push('/partners/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
