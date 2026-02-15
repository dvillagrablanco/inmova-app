import { Loader2 } from 'lucide-react';

export default function ComunidadesLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Cargando comunidades...</p>
      </div>
    </div>
  );
}
