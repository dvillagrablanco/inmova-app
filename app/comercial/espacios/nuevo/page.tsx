'use client';

import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NuevoEspacioPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/comercial">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Espacio Comercial</h1>
            <p className="text-muted-foreground">Registra un nuevo local, oficina o nave</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
