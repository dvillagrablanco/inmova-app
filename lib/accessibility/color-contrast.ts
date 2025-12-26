/**
 * Color Contrast Utilities - WCAG 2.1 AA Compliance
 * Helps ensure color combinations meet accessibility standards
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLuminance = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLuminance = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLuminance = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLuminance + 0.7152 * gLuminance + 0.0722 * bLuminance;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG AA standard (4.5:1)
 */
export function meetsWCAG_AA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standard (7:1)
 */
export function meetsWCAG_AAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * Check if color combination meets WCAG AA Large Text standard (3:1)
 */
export function meetsWCAG_AA_LargeText(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 3;
}

/**
 * Get recommended text color (black or white) for a given background
 */
export function getRecommendedTextColor(backgroundColor: string): '#000000' | '#FFFFFF' {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Validate a color palette for accessibility
 */
export function validateColorPalette(palette: Record<string, string>): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check common color combinations
  if (palette.primary && palette.background) {
    if (!meetsWCAG_AA(palette.primary, palette.background)) {
      issues.push('Primary color on background does not meet WCAG AA standard');
    }
  }

  if (palette.secondary && palette.background) {
    if (!meetsWCAG_AA(palette.secondary, palette.background)) {
      issues.push('Secondary color on background does not meet WCAG AA standard');
    }
  }

  if (palette.text && palette.background) {
    if (!meetsWCAG_AA(palette.text, palette.background)) {
      issues.push('Text color on background does not meet WCAG AA standard');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
