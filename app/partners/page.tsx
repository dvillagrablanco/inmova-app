'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    </div>
  );
}
