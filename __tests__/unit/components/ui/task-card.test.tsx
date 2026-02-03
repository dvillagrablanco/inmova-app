import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/ui/task-card';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

describe('TaskCard', () => {
  const baseProps = {
    id: 'task-1',
    title: 'Tarea pendiente',
    description: 'Detalle',
    category: 'General',
    completed: false,
    onComplete: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  };

  it('renderiza título y categoría', () => {
    render(<TaskCard {...baseProps} />);

    expect(screen.getByText('Tarea pendiente')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('ejecuta acciones', () => {
    render(<TaskCard {...baseProps} />);

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(baseProps.onEdit).toHaveBeenCalledWith('task-1');

    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(baseProps.onDelete).toHaveBeenCalledWith('task-1');

    fireEvent.click(screen.getByRole('checkbox'));
    expect(baseProps.onComplete).toHaveBeenCalledWith('task-1', true);
  });
});
