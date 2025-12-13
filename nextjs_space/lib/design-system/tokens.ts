/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

export const designTokens = {
  colors: {
    brand: {
      primary: {
        50: 'hsl(235, 89%, 97%)',
        100: 'hsl(235, 89%, 93%)',
        200: 'hsl(235, 89%, 86%)',
        300: 'hsl(235, 89%, 77%)',
        400: 'hsl(235, 89%, 66%)',
        500: 'hsl(235, 89%, 55%)',
        600: 'hsl(235, 89%, 45%)',
        700: 'hsl(235, 70%, 35%)',
        800: 'hsl(235, 60%, 25%)',
        900: 'hsl(235, 50%, 15%)',
      },
      secondary: {
        50: 'hsl(340, 82%, 97%)',
        100: 'hsl(340, 82%, 93%)',
        200: 'hsl(340, 82%, 86%)',
        300: 'hsl(340, 82%, 77%)',
        400: 'hsl(340, 82%, 66%)',
        500: 'hsl(340, 82%, 55%)',
        600: 'hsl(340, 82%, 45%)',
        700: 'hsl(340, 70%, 35%)',
        800: 'hsl(340, 60%, 25%)',
        900: 'hsl(340, 50%, 15%)',
      },
    },
    semantic: {
      success: {
        light: 'hsl(142, 76%, 90%)',
        DEFAULT: 'hsl(142, 76%, 36%)',
        dark: 'hsl(142, 76%, 24%)',
      },
      error: {
        light: 'hsl(0, 84%, 90%)',
        DEFAULT: 'hsl(0, 84%, 60%)',
        dark: 'hsl(0, 84%, 40%)',
      },
      warning: {
        light: 'hsl(45, 93%, 90%)',
        DEFAULT: 'hsl(45, 93%, 47%)',
        dark: 'hsl(45, 93%, 30%)',
      },
      info: {
        light: 'hsl(200, 98%, 90%)',
        DEFAULT: 'hsl(200, 98%, 39%)',
        dark: 'hsl(200, 98%, 25%)',
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
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
      '5xl': ['3rem', { lineHeight: '1' }],          // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
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
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    primary: '0 10px 40px -10px rgba(79, 70, 229, 0.4)',
    success: '0 10px 40px -10px rgba(16, 185, 129, 0.4)',
    error: '0 10px 40px -10px rgba(239, 68, 68, 0.4)',
    warning: '0 10px 40px -10px rgba(245, 158, 11, 0.4)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  zIndex: {
    base: '0',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
  },
};

export type DesignTokens = typeof designTokens;

// Helper functions
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || path;
};

export const getSpacing = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size] || size;
};

export const getShadow = (size: keyof typeof designTokens.shadows): string => {
  return designTokens.shadows[size] || size;
};
