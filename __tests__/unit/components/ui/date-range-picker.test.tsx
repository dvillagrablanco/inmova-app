import { format } from 'date-fns';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

describe('DateRangePicker', () => {
  const emptyRange = {} as DateRange;

  it('renderiza el placeholder cuando no hay fechas', () => {
    render(
      <DateRangePicker value={emptyRange} onChange={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /Pick a date range/i })
    ).toBeInTheDocument();
  });

  it('renderiza el rango formateado cuando hay fechas', () => {
    const from = new Date(2024, 0, 10);
    const to = new Date(2024, 0, 20);
    const value: DateRange = { from, to };

    render(<DateRangePicker value={value} onChange={vi.fn()} />);

    const expected = `${format(from, 'LLL dd, y')} - ${format(
      to,
      'LLL dd, y'
    )}`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('muestra el boton con label accesible', () => {
    render(
      <DateRangePicker value={emptyRange} onChange={vi.fn()} />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
