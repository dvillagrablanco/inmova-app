import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  isValidEmail,
  isValidPhone,
  getInitials,
  pluralize,
  getColorByStatus,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with default EUR', () => {
      expect(formatCurrency(1000)).toBe('1.000,00 €');
    });

    it('formats currency with custom currency', () => {
      expect(formatCurrency(1000, 'USD', 'en-US')).toContain('1,000.00');
    });
  });

  describe('formatDate', () => {
    it('formats date in short format', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'short');
      expect(formatted).toContain('15');
      expect(formatted).toContain('01');
    });
  });

  describe('formatNumber', () => {
    it('formats number with default locale', () => {
      expect(formatNumber(1000)).toBe('1.000');
    });

    it('formats number with decimals', () => {
      expect(formatNumber(1000.5, 2)).toBe('1.000,50');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage correctly', () => {
      expect(formatPercentage(0.75)).toBe('75,00%');
    });

    it('formats percentage with custom decimals', () => {
      expect(formatPercentage(0.75, 0)).toBe('75%');
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('validates correct phone number', () => {
      expect(isValidPhone('+34612345678')).toBe(true);
      expect(isValidPhone('612345678')).toBe(true);
    });

    it('rejects invalid phone number', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
    });
  });

  describe('getInitials', () => {
    it('gets initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('gets initial from single name', () => {
      expect(getInitials('John')).toBe('JO');
    });

    it('handles empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('pluralize', () => {
    it('returns singular for count 1', () => {
      expect(pluralize(1, 'building')).toBe('1 building');
    });

    it('returns plural for count > 1', () => {
      expect(pluralize(2, 'building')).toBe('2 buildings');
    });

    it('uses custom plural form', () => {
      expect(pluralize(2, 'property', 'properties')).toBe('2 properties');
    });
  });

  describe('getColorByStatus', () => {
    it('returns correct color for each status', () => {
      expect(getColorByStatus('pendiente')).toBe('yellow');
      expect(getColorByStatus('completado')).toBe('green');
      expect(getColorByStatus('activo')).toBe('green');
      expect(getColorByStatus('cancelado')).toBe('red');
    });

    it('returns default color for unknown status', () => {
      expect(getColorByStatus('unknown')).toBe('gray');
    });
  });
});
