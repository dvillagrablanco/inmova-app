import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';

describe('MultiFileUpload', () => {
  const baseProps = {
    onFilesSelect: vi.fn(),
  };

  it('should render without crashing', () => {
    render(<MultiFileUpload {...baseProps} />);

    expect(
      screen.getByText('Arrastra archivos aquí o haz clic para seleccionar')
    ).toBeInTheDocument();
  });

  it('should call onFilesSelect when files are chosen', () => {
    const onFilesSelect = vi.fn();
    const { container } = render(<MultiFileUpload onFilesSelect={onFilesSelect} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(['contenido'], 'contrato.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelect).toHaveBeenCalledWith([file]);
  });

  it('should show accepted file types when provided', () => {
    render(<MultiFileUpload acceptedFileTypes={['.pdf']} />);

    expect(screen.getByText(/Tipos permitidos: \.pdf/i)).toBeInTheDocument();
  });
});
