/**
 * Colores asignados a cada sociedad del Grupo Vidaro.
 * Se usan como acento en badges, bordes de tarjetas, pins del mapa, etc.
 */

export const COMPANY_COLORS: Record<string, string> = {
  // Holding
  'Vidaro': '#4F46E5',          // Indigo
  'Vidaro Inversiones': '#4F46E5',
  
  // Filiales
  'Viroda': '#2563EB',          // Blue
  'Viroda Inversiones': '#2563EB',
  'Rovida': '#059669',          // Emerald
  'Facundo': '#7C3AED',         // Violet
  'Facundo Blanco': '#7C3AED',
  'Disfasa': '#DC2626',         // Red
  'Los Girasoles': '#D97706',   // Amber
  'PDV Gesfasa': '#0891B2',     // Cyan
  'VIBLA': '#B45309',           // Gold/amber dark
  'VIBLA Private': '#B45309',
  'Industrial y Comercial': '#6D28D9', // Purple
};

/**
 * Obtener color para una empresa por nombre (búsqueda parcial).
 */
export function getCompanyColor(companyName: string): string {
  if (!companyName) return '#6B7280'; // gray default
  
  const nameLower = companyName.toLowerCase();
  for (const [key, color] of Object.entries(COMPANY_COLORS)) {
    if (nameLower.includes(key.toLowerCase())) return color;
  }
  
  // Fallback: hash-based color
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 45%)`;
}

/**
 * Obtener clase Tailwind de background para una empresa.
 */
export function getCompanyBgClass(companyName: string): string {
  const nameLower = (companyName || '').toLowerCase();
  if (nameLower.includes('vidaro')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  if (nameLower.includes('viroda')) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (nameLower.includes('rovida')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (nameLower.includes('facundo')) return 'bg-violet-100 text-violet-800 border-violet-300';
  if (nameLower.includes('disfasa')) return 'bg-red-100 text-red-800 border-red-300';
  if (nameLower.includes('girasoles')) return 'bg-amber-100 text-amber-800 border-amber-300';
  if (nameLower.includes('pdv') || nameLower.includes('gesfasa')) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
  if (nameLower.includes('vibla')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (nameLower.includes('industrial')) return 'bg-purple-100 text-purple-800 border-purple-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
}
