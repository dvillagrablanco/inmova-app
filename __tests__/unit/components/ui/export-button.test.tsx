import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from '@/components/ui/export-button';

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

vi.mock('@/lib/export-utils', () => ({
  exportToCSV: vi.fn(),
  exportToExcel: vi.fn(),
  exportToPDF: vi.fn(),
}));

const baseProps = {
  data: [{ id: 1, name: 'Item 1' }],
  columns: [{ key: 'name', label: 'Nombre' }],
  filename: 'export',
};

describe('ExportButton', () => {
  it('should render without crashing', () => {
    render(<ExportButton {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(<ExportButton {...baseProps} disabled />);

    expect(screen.getByRole('button', { name: 'Exportar' })).toBeDisabled();
  });

  it('should handle user interactions', async () => {
    const { exportToCSV } = await import('@/lib/export-utils');
    render(<ExportButton {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    fireEvent.click(screen.getByText('Exportar a CSV'));

    await waitFor(() => {
      expect(exportToCSV).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    const { exportToPDF } = await import('@/lib/export-utils');
    render(<ExportButton {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    fireEvent.click(screen.getByText('Exportar a PDF'));

    await waitFor(() => {
      expect(exportToPDF).toHaveBeenCalled();
    });
  });

  it('should be accessible', () => {
    render(<ExportButton {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
  });
});
