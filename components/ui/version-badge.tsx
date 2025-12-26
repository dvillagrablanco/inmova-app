'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  deploymentId: string;
  environment: string;
  isProduction: boolean;
}

/**
 * Badge que muestra la versión actual de la aplicación
 * Solo visible en desarrollo o para administradores
 */
export function VersionBadge({
  showInProduction = false,
  className = '',
}: {
  showInProduction?: boolean;
  className?: string;
}) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Cargar información de versión
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVersionInfo(data.data);
        }
      })
      .catch((err) => console.error('Error loading version:', err));
  }, []);

  // No mostrar en producción a menos que se especifique
  if (versionInfo?.isProduction && !showInProduction) {
    return null;
  }

  if (!versionInfo) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="bg-gray-900/90 text-white px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
        title="Click para ver detalles de la versión"
      >
        <Info size={14} />v{versionInfo.version}
      </button>

      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 text-white p-4 rounded-lg text-xs font-mono space-y-2 shadow-xl min-w-[300px]">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
            <span className="font-bold text-sm">Información de Versión</span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <div>
              <span className="text-gray-400">Versión:</span>{' '}
              <span className="text-green-400">{versionInfo.version}</span>
            </div>
            <div>
              <span className="text-gray-400">Entorno:</span>{' '}
              <span className={versionInfo.isProduction ? 'text-red-400' : 'text-yellow-400'}>
                {versionInfo.environment}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Build:</span>{' '}
              <span className="text-blue-400">
                {new Date(versionInfo.buildTime).toLocaleString('es-ES')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Commit:</span>{' '}
              <span className="text-purple-400">{versionInfo.gitCommit.substring(0, 7)}</span>
            </div>
            <div>
              <span className="text-gray-400">Deployment:</span>{' '}
              <span className="text-gray-300 break-all">{versionInfo.deploymentId}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(versionInfo, null, 2));
                alert('Información copiada al portapapeles');
              }}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              📋 Copiar información
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VersionBadge;
