import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toContain('base');
      expect(result).toContain('included');
      expect(result).not.toContain('excluded');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should merge tailwind classes correctly', () => {
      const result = cn('p-4 text-red-500', 'p-8');
      // Should override p-4 with p-8
      expect(result).toContain('p-8');
      expect(result).not.toContain('p-4');
    });
  });
});
