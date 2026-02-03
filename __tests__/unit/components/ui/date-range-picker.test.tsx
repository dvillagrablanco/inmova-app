import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '@/components/ui/date-range-picker';

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (value: any) => void }) => (
    <button
      type="button"
      onClick={() => onSelect({ from: new Date(2025, 0, 1), to: new Date(2025, 0, 2) })}
    >
      Calendar
    </button>
  ),
}));

describe('DateRangePicker', () => {
  it('muestra el placeholder cuando no hay fechas', () => {
    render(<DateRangePicker value={{ from: undefined, to: undefined }} onChange={vi.fn()} />);

    expect(screen.getByText(/pick a date range/i)).toBeInTheDocument();
  });

  it('dispara onChange al seleccionar un rango', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{ from: undefined, to: undefined }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /calendar/i }));
    expect(onChange).toHaveBeenCalled();
  });

  it('acepta className personalizado', () => {
    render(
      <DateRangePicker
        value={{ from: undefined, to: undefined }}
        onChange={vi.fn()}
        className="custom-class"
      />
    );

    expect(document.querySelector('.custom-class')).toBeTruthy();
  });
});
