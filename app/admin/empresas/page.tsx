'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect de /admin/empresas a /admin/clientes
 * La gestión de empresas se realiza desde la página de clientes B2B
 */
export default function EmpresasRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/clientes');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="h-20 w-20 mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <p className="text-gray-600">Redirigiendo a Gestión de Empresas...</p>
      </div>
    </div>
  );
}
