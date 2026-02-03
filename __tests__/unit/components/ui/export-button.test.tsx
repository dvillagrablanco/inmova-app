import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '@/components/ui/export-button';

vi.mock('@/lib/export-utils', () => ({
  exportToCSV: vi.fn(),
  exportToExcel: vi.fn(),
  exportToPDF: vi.fn(),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ExportButton', () => {
  const data = [{ id: 1, name: 'Item' }];
  const columns = [{ key: 'name', label: 'Nombre' }];

  it('should render without crashing', () => {
    render(<ExportButton data={data} columns={columns} filename="export" />);

    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
  });

  it('should open menu and allow export selection', () => {
    render(<ExportButton data={data} columns={columns} filename="export" />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

    expect(screen.getByText('Exportar a CSV')).toBeInTheDocument();
    expect(screen.getByText('Exportar a Excel')).toBeInTheDocument();
    expect(screen.getByText('Exportar a PDF')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<ExportButton data={data} columns={columns} filename="export" />);

    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
  });
});
