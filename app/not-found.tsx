import Link from 'next/link';
import { Building2, Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-8">
          <Building2 className="w-8 h-8 text-white" />
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
          404
        </h1>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Página no encontrada</h2>

        {/* Descripción */}
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          La página que buscas no existe o ha sido movida. Verifica la URL o navega a una de las
          secciones principales.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/30">
              <Home className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Button>
          </Link>
          <Link href="/landing">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Página de Inicio
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-gray-400">© {new Date().getFullYear()} INMOVA</p>
      </div>
    </div>
  );
}
