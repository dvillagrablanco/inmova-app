'use client';

import { FC } from 'react';

interface IllustrationProps {
  className?: string;
  size?: number;
}

// Ilustración: Sin propiedades
export const NoPropertiesIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="40" y="70" width="120" height="100" rx="4" fill="#E0E7FF" />
    <rect x="50" y="80" width="30" height="40" rx="2" fill="#6366F1" opacity="0.3" />
    <rect x="90" y="80" width="30" height="40" rx="2" fill="#6366F1" opacity="0.3" />
    <rect x="130" y="80" width="20" height="40" rx="2" fill="#6366F1" opacity="0.3" />
    <path d="M100 40L40 70H160L100 40Z" fill="#818CF8" />
    <circle cx="100" cy="100" r="50" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin propiedades
    </text>
  </svg>
);

// Ilustración: Sin inquilinos
export const NoTenantsIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="100" cy="70" r="30" fill="#E0E7FF" />
    <path d="M100 100C80 100 65 115 65 135V160H135V135C135 115 120 100 100 100Z" fill="#818CF8" />
    <circle cx="70" cy="80" r="20" fill="#C7D2FE" opacity="0.5" />
    <circle cx="130" cy="80" r="20" fill="#C7D2FE" opacity="0.5" />
    <circle cx="100" cy="100" r="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin inquilinos
    </text>
  </svg>
);

// Ilustración: Sin pagos
export const NoPaymentsIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="40" y="60" width="120" height="80" rx="8" fill="#E0E7FF" />
    <rect x="50" y="70" width="100" height="12" rx="2" fill="#6366F1" opacity="0.4" />
    <rect x="50" y="90" width="60" height="8" rx="2" fill="#818CF8" opacity="0.3" />
    <circle cx="140" cy="100" r="15" fill="#FDE047" opacity="0.8" />
    <text x="140" y="105" textAnchor="middle" fill="#78350F" fontSize="16" fontWeight="bold">€</text>
    <circle cx="100" cy="100" r="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin pagos registrados
    </text>
  </svg>
);

// Ilustración: Sin contratos
export const NoContractsIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="60" y="40" width="80" height="110" rx="4" fill="#E0E7FF" />
    <rect x="70" y="55" width="60" height="4" rx="1" fill="#6366F1" opacity="0.4" />
    <rect x="70" y="65" width="50" height="4" rx="1" fill="#818CF8" opacity="0.3" />
    <rect x="70" y="75" width="55" height="4" rx="1" fill="#818CF8" opacity="0.3" />
    <rect x="70" y="85" width="45" height="4" rx="1" fill="#818CF8" opacity="0.3" />
    <path d="M80 130L90 140L110 115" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    <circle cx="100" cy="100" r="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin contratos activos
    </text>
  </svg>
);

// Ilustración: Sin mantenimiento
export const NoMaintenanceIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M80 60L100 40L120 60V140H80V60Z" fill="#E0E7FF" />
    <rect x="90" y="80" width="20" height="25" rx="2" fill="#6366F1" opacity="0.3" />
    <rect x="95" y="120" width="10" height="20" rx="1" fill="#818CF8" opacity="0.3" />
    <circle cx="130" cy="80" r="20" fill="#FDE047" opacity="0.7" />
    <path d="M120 80L125 70L130 80L140 75L130 85L140 90L130 95Z" fill="#78350F" opacity="0.6" />
    <circle cx="100" cy="100" r="65" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin tareas de mantenimiento
    </text>
  </svg>
);

// Ilustración: Sin reportes
export const NoReportsIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="50" y="60" width="100" height="80" rx="4" fill="#E0E7FF" />
    <rect x="60" y="110" width="10" height="20" fill="#6366F1" opacity="0.5" />
    <rect x="75" y="100" width="10" height="30" fill="#6366F1" opacity="0.6" />
    <rect x="90" y="90" width="10" height="40" fill="#6366F1" opacity="0.7" />
    <rect x="105" y="95" width="10" height="35" fill="#6366F1" opacity="0.6" />
    <rect x="120" y="105" width="10" height="25" fill="#6366F1" opacity="0.5" />
    <circle cx="100" cy="100" r="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin reportes generados
    </text>
  </svg>
);

// Ilustración: Sin resultados de búsqueda
export const NoSearchResultsIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="90" cy="90" r="35" stroke="#818CF8" strokeWidth="4" fill="none" />
    <path d="M115 115L140 140" stroke="#818CF8" strokeWidth="6" strokeLinecap="round" />
    <line x1="70" y1="70" x2="110" y2="110" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    <line x1="110" y1="70" x2="70" y2="110" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    <circle cx="100" cy="100" r="65" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin resultados
    </text>
  </svg>
);

// Ilustración: Sin notificaciones
export const NoNotificationsIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M100 50C85 50 75 60 75 75V100L65 120H135L125 100V75C125 60 115 50 100 50Z" fill="#E0E7FF" />
    <rect x="90" y="120" width="20" height="10" rx="2" fill="#818CF8" />
    <circle cx="100" cy="100" r="60" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <path d="M80 80L90 90M120 80L110 90" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin notificaciones
    </text>
  </svg>
);

// Ilustración genérica: Datos vacíos
export const EmptyDataIllustration: FC<IllustrationProps> = ({ className, size = 200 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="50" y="70" width="100" height="70" rx="4" fill="#E0E7FF" />
    <rect x="60" y="85" width="80" height="8" rx="2" fill="#C7D2FE" opacity="0.5" />
    <rect x="60" y="100" width="60" height="8" rx="2" fill="#C7D2FE" opacity="0.4" />
    <rect x="60" y="115" width="70" height="8" rx="2" fill="#C7D2FE" opacity="0.4" />
    <circle cx="100" cy="100" r="65" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <text x="100" y="190" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="system-ui">
      Sin datos disponibles
    </text>
  </svg>
);

export default {
  NoPropertiesIllustration,
  NoTenantsIllustration,
  NoPaymentsIllustration,
  NoContractsIllustration,
  NoMaintenanceIllustration,
  NoReportsIllustration,
  NoSearchResultsIllustration,
  NoNotificationsIllustration,
  EmptyDataIllustration,
};
