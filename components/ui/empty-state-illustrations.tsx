/**
 * Ilustraciones SVG para estados vacíos
 * Diseñadas para consistencia visual y accesibilidad
 */

import React from 'react';

interface IllustrationProps {
  className?: string;
}

/**
 * Ilustración: Sin edificios
 */
export function NoBuildingsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de edificio vacío"
    >
      {/* Edificio principal */}
      <rect
        x="60"
        y="40"
        width="80"
        height="100"
        rx="4"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
      />

      {/* Ventanas */}
      <rect x="70" y="55" width="15" height="15" rx="2" fill="#D1D5DB" />
      <rect x="95" y="55" width="15" height="15" rx="2" fill="#D1D5DB" />
      <rect x="120" y="55" width="15" height="15" rx="2" fill="#D1D5DB" />

      <rect x="70" y="80" width="15" height="15" rx="2" fill="#D1D5DB" />
      <rect x="95" y="80" width="15" height="15" rx="2" fill="#D1D5DB" />
      <rect x="120" y="80" width="15" height="15" rx="2" fill="#D1D5DB" />

      <rect x="70" y="105" width="15" height="15" rx="2" fill="#D1D5DB" />
      <rect x="95" y="105" width="15" height="15" rx="2" fill="#D1D5DB" />
      <rect x="120" y="105" width="15" height="15" rx="2" fill="#D1D5DB" />

      {/* Puerta */}
      <rect x="85" y="125" width="30" height="15" rx="2" fill="#9CA3AF" />

      {/* Línea punteada alrededor */}
      <circle
        cx="100"
        cy="90"
        r="70"
        stroke="#D1D5DB"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * Ilustración: Sin unidades
 */
export function NoUnitsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de unidad vacía"
    >
      {/* Puerta */}
      <path d="M60 140H140V60H60V140Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />

      {/* Manija */}
      <circle cx="120" cy="100" r="4" fill="#9CA3AF" />

      {/* Ventana */}
      <rect
        x="80"
        y="75"
        width="40"
        height="30"
        rx="2"
        fill="#D1D5DB"
        stroke="#9CA3AF"
        strokeWidth="1.5"
      />
      <line x1="100" y1="75" x2="100" y2="105" stroke="#9CA3AF" strokeWidth="1.5" />
      <line x1="80" y1="90" x2="120" y2="90" stroke="#9CA3AF" strokeWidth="1.5" />

      {/* Marco decorativo */}
      <rect
        x="50"
        y="50"
        width="100"
        height="100"
        rx="4"
        stroke="#D1D5DB"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
    </svg>
  );
}

/**
 * Ilustración: Sin inquilinos
 */
export function NoTenantsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de personas"
    >
      {/* Persona 1 */}
      <circle cx="70" cy="60" r="20" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
      <path
        d="M40 120C40 95 55 85 70 85C85 85 100 95 100 120"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
      />

      {/* Persona 2 */}
      <circle cx="130" cy="60" r="20" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
      <path
        d="M100 120C100 95 115 85 130 85C145 85 160 95 160 120"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
      />

      {/* Signo de más */}
      <circle cx="170" cy="40" r="12" fill="#6366F1" opacity="0.2" />
      <line
        x1="170"
        y1="33"
        x2="170"
        y2="47"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="163"
        y1="40"
        x2="177"
        y2="40"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Ilustración: Sin contratos
 */
export function NoContractsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de documento"
    >
      {/* Documento */}
      <path d="M60 30H120L150 60V140H60V30Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />

      {/* Esquina doblada */}
      <path d="M120 30V60H150" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="2" />

      {/* Líneas de texto */}
      <line
        x1="75"
        y1="80"
        x2="135"
        y2="80"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="95"
        x2="135"
        y2="95"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="110"
        x2="110"
        y2="110"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Firma */}
      <path
        d="M75 125Q85 120 95 125T115 125"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Ilustración: Sin pagos
 */
export function NoPaymentsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de tarjeta de crédito"
    >
      {/* Tarjeta */}
      <rect
        x="40"
        y="60"
        width="120"
        height="70"
        rx="8"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
      />

      {/* Banda magnética */}
      <rect x="40" y="75" width="120" height="15" fill="#9CA3AF" />

      {/* Chip */}
      <rect
        x="55"
        y="100"
        width="25"
        height="20"
        rx="3"
        fill="#D1D5DB"
        stroke="#9CA3AF"
        strokeWidth="1.5"
      />
      <rect x="60" y="103" width="15" height="14" rx="2" fill="#FCD34D" />

      {/* Números */}
      <line
        x1="95"
        y1="110"
        x2="145"
        y2="110"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="55"
        y1="125"
        x2="100"
        y2="125"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Ilustración: Sin mantenimientos
 */
export function NoMaintenanceIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de herramientas"
    >
      {/* Llave inglesa */}
      <path
        d="M60 100L80 80L90 90L70 110L60 100Z"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
      />
      <rect
        x="85"
        y="75"
        width="40"
        height="10"
        rx="2"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
        transform="rotate(-45 85 75)"
      />

      {/* Martillo */}
      <rect
        x="110"
        y="90"
        width="50"
        height="8"
        rx="2"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
        transform="rotate(45 110 90)"
      />
      <rect
        x="135"
        y="65"
        width="15"
        height="30"
        rx="2"
        fill="#D1D5DB"
        stroke="#9CA3AF"
        strokeWidth="2"
        transform="rotate(45 135 65)"
      />

      {/* Círculo decorativo */}
      <circle
        cx="100"
        cy="90"
        r="60"
        stroke="#D1D5DB"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * Ilustración: Sin datos/resultados
 */
export function NoDataIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de carpeta vacía"
    >
      {/* Carpeta */}
      <path d="M40 60H80L95 50H160V130H40V60Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />

      {/* Carpeta trasera */}
      <path d="M45 65H155V125H45V65Z" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2" />

      {/* Ícono de vacío */}
      <circle cx="100" cy="95" r="15" fill="white" stroke="#D1D5DB" strokeWidth="2" />
      <line
        x1="100"
        y1="88"
        x2="100"
        y2="102"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Ilustración: Búsqueda sin resultados
 */
export function NoSearchResultsIllustration({ className }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de lupa"
    >
      {/* Lupa */}
      <circle cx="85" cy="75" r="35" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="3" />
      <circle cx="85" cy="75" r="25" fill="white" />
      <line
        x1="110"
        y1="100"
        x2="140"
        y2="130"
        stroke="#9CA3AF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* X dentro de la lupa */}
      <line
        x1="75"
        y1="65"
        x2="95"
        y2="85"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="95"
        y1="65"
        x2="75"
        y2="85"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
