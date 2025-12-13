/**
 * Constantes de Marca - INMOVA
 * Asegura consistencia visual en toda la aplicación
 */

// Colores de marca
export const BRAND_COLORS = {
  // Primarios
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',  // Color principal
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  
  // Secundarios (violeta/púrpura)
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },
  
  // Acento (rosa para destacados)
  accent: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  
  // Estados
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutrales
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Gradientes de marca
export const BRAND_GRADIENTS = {
  primary: 'bg-gradient-to-r from-indigo-600 to-violet-600',
  primaryHover: 'bg-gradient-to-r from-indigo-700 to-violet-700',
  secondary: 'bg-gradient-to-r from-violet-600 to-purple-600',
  accent: 'bg-gradient-to-r from-pink-500 to-rose-500',
  subtle: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
  dark: 'bg-gradient-to-b from-gray-900 to-black',
} as const;

// Tipografía
export const BRAND_TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Espaciado
export const BRAND_SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

// Bordes y radios
export const BRAND_BORDERS = {
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  width: {
    thin: '1px',
    normal: '2px',
    thick: '4px',
  },
} as const;

// Sombras
export const BRAND_SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Sombras con color de marca
  primaryGlow: '0 10px 40px -10px rgba(99, 102, 241, 0.5)',
  secondaryGlow: '0 10px 40px -10px rgba(168, 85, 247, 0.5)',
} as const;

// Duraciones de animación
export const BRAND_ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Breakpoints responsivos
export const BRAND_BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index
export const BRAND_Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

// Iconos (tamaños consistentes)
export const BRAND_ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// Utilidad para obtener color con opacidad
export function withOpacity(color: string, opacity: number): string {
  // Asume que el color viene en formato hex
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Utilidad para obtener clase de gradiente
export function getGradientClass(type: keyof typeof BRAND_GRADIENTS): string {
  return BRAND_GRADIENTS[type];
}

// Utilidad para obtener sombra con color de marca
export function getBrandShadow(color: 'primary' | 'secondary', intensity: number = 0.5): string {
  const baseColor = color === 'primary' ? '99, 102, 241' : '168, 85, 247';
  return `0 10px 40px -10px rgba(${baseColor}, ${intensity})`;
}
