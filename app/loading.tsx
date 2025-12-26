/**
 * Global Loading State
 * Loading UI para la aplicación
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        {/* Animated loader */}
        <div className="relative">
          <div className="h-20 w-20 mx-auto">
            <Loader2 className="h-20 w-20 text-blue-600 animate-spin" />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Cargando...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </div>

        {/* Loading bar */}
        <div className="w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
