/**
 * Design System Tokens para INMOVA
 * Sistema centralizado de colores, espaciado, tipografía y más
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
        500: 'hsl(235, 89%, 56%)',
        600: 'hsl(235, 89%, 46%)',
        700: 'hsl(235, 89%, 36%)',
        800: 'hsl(235, 89%, 26%)',
        900: 'hsl(235, 89%, 16%)',
      },
      secondary: {
        50: 'hsl(200, 100%, 97%)',
        100: 'hsl(200, 100%, 93%)',
        200: 'hsl(200, 100%, 86%)',
        300: 'hsl(200, 100%, 76%)',
        400: 'hsl(200, 100%, 66%)',
        500: 'hsl(200, 100%, 56%)',
        600: 'hsl(200, 100%, 46%)',
        700: 'hsl(200, 100%, 36%)',
        800: 'hsl(200, 100%, 26%)',
        900: 'hsl(200, 100%, 16%)',
      },
    },
    semantic: {
      success: {
        light: 'hsl(142, 71%, 45%)',
        DEFAULT: 'hsl(142, 71%, 35%)',
        dark: 'hsl(142, 71%, 25%)',
        bg: 'hsl(142, 71%, 95%)',
      },
      error: {
        light: 'hsl(0, 84%, 60%)',
        DEFAULT: 'hsl(0, 84%, 50%)',
        dark: 'hsl(0, 84%, 40%)',
        bg: 'hsl(0, 84%, 95%)',
      },
      warning: {
        light: 'hsl(45, 93%, 47%)',
        DEFAULT: 'hsl(45, 93%, 37%)',
        dark: 'hsl(45, 93%, 27%)',
        bg: 'hsl(45, 93%, 95%)',
      },
      info: {
        light: 'hsl(200, 100%, 56%)',
        DEFAULT: 'hsl(200, 100%, 46%)',
        dark: 'hsl(200, 100%, 36%)',
        bg: 'hsl(200, 100%, 95%)',
      },
    },
    neutral: {
      50: 'hsl(0, 0%, 98%)',
      100: 'hsl(0, 0%, 96%)',
      200: 'hsl(0, 0%, 90%)',
      300: 'hsl(0, 0%, 83%)',
      400: 'hsl(0, 0%, 64%)',
      500: 'hsl(0, 0%, 45%)',
      600: 'hsl(0, 0%, 32%)',
      700: 'hsl(0, 0%, 25%)',
      800: 'hsl(0, 0%, 15%)',
      900: 'hsl(0, 0%, 9%)',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
    '4xl': '4rem',
    '5xl': '5rem',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      heading: ['Poppins', 'Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
      '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
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
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    springy: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
} as const;

export type DesignTokens = typeof designTokens;
export type ColorScale = keyof typeof designTokens.colors.brand.primary;
export type SemanticColor = keyof typeof designTokens.colors.semantic;
export type SpacingSize = keyof typeof designTokens.spacing;
