'use client';

import dynamic from 'next/dynamic';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { RefreshCw } from 'lucide-react';

const ServiciosLimpiezaContent = dynamic(() => import('./content'), {
  ssr: false,
  loading: () => (
    <AuthenticatedLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AuthenticatedLayout>
  ),
});

export default function ServiciosLimpiezaPage() {
  return <ServiciosLimpiezaContent />;
}
