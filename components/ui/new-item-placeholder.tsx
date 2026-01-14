'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';

export default function NewItemPlaceholder({ title }: { title: string }) {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
      <div className="bg-indigo-50 p-6 rounded-full mb-6">
        <Construction className="h-12 w-12 text-indigo-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 max-w-md mb-8">
        El formulario de creación está en desarrollo. Pronto podrás registrar nuevos elementos desde aquí.
      </p>
      <Button onClick={() => router.back()} variant="outline" className="gap-2">
        <ArrowLeft size={16} />
        Volver
      </Button>
    </div>
  );
}
