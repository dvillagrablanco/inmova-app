/**
 * Sistema de Design Tokens centralizado para INMOVA
 * Define colores, espaciado, tipografía, sombras y transiciones de forma consistente
 */

export const designTokens = {
  colors: {
    brand: {
      primary: {
        50: 'hsl(235, 89%, 97%)',
        100: 'hsl(235, 89%, 93%)',
        200: 'hsl(235, 89%, 86%)',
        300: 'hsl(235, 89%, 76%)',
        400: 'hsl(235, 89%, 66%)',
        500: 'hsl(235, 89%, 56%)', // Main brand color
        600: 'hsl(235, 89%, 46%)',
        700: 'hsl(235, 89%, 36%)',
        800: 'hsl(235, 89%, 26%)',
        900: 'hsl(235, 89%, 16%)',
        950: 'hsl(235, 89%, 10%)',
      },
      secondary: {
        50: 'hsl(220, 70%, 97%)',
        100: 'hsl(220, 70%, 93%)',
        200: 'hsl(220, 70%, 86%)',
        300: 'hsl(220, 70%, 76%)',
        400: 'hsl(220, 70%, 66%)',
        500: 'hsl(220, 70%, 56%)',
        600: 'hsl(220, 70%, 46%)',
        700: 'hsl(220, 70%, 36%)',
        800: 'hsl(220, 70%, 26%)',
        900: 'hsl(220, 70%, 16%)',
      },
    },
    semantic: {
      success: {
        light: 'hsl(142, 76%, 90%)',
        DEFAULT: 'hsl(142, 76%, 45%)',
        dark: 'hsl(142, 76%, 35%)',
      },
      error: {
        light: 'hsl(0, 84%, 95%)',
        DEFAULT: 'hsl(0, 84%, 60%)',
        dark: 'hsl(0, 84%, 45%)',
      },
      warning: {
        light: 'hsl(45, 93%, 90%)',
        DEFAULT: 'hsl(45, 93%, 47%)',
        dark: 'hsl(45, 93%, 37%)',
      },
      info: {
        light: 'hsl(199, 89%, 90%)',
        DEFAULT: 'hsl(199, 89%, 48%)',
        dark: 'hsl(199, 89%, 38%)',
      },
    },
    neutral: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 20%, 95%)',
      200: 'hsl(210, 16%, 93%)',
      300: 'hsl(210, 14%, 89%)',
      400: 'hsl(210, 14%, 83%)',
      500: 'hsl(210, 11%, 71%)',
      600: 'hsl(210, 7%, 56%)',
      700: 'hsl(210, 9%, 31%)',
      800: 'hsl(210, 10%, 23%)',
      900: 'hsl(210, 11%, 15%)',
      950: 'hsl(210, 13%, 9%)',
    },
  },
  spacing: {
    xs: '0.25rem',     // 4px
    sm: '0.5rem',      // 8px
    md: '1rem',        // 16px
    lg: '1.5rem',      // 24px
    xl: '2rem',        // 32px
    '2xl': '2.5rem',   // 40px
    '3xl': '3rem',     // 48px
    '4xl': '4rem',     // 64px
    '5xl': '5rem',     // 80px
    '6xl': '6rem',     // 96px
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      heading: ['Poppins', 'Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.0125em' }],
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.0125em' }],
      xl: ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.0125em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],
      '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
      '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.0625em' }],
    },
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    primary: '0 10px 40px -10px rgba(79, 70, 229, 0.4)',
    success: '0 10px 40px -10px rgba(34, 197, 94, 0.4)',
    error: '0 10px 40px -10px rgba(239, 68, 68, 0.4)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    verySlow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type DesignTokens = typeof designTokens;
