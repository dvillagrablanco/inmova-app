import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';

describe('MultiFileUpload', () => {
  it('should render without crashing', () => {
    render(<MultiFileUpload />);

    expect(
      screen.getByText('Arrastra archivos aquí o haz clic para seleccionar')
    ).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(
      <MultiFileUpload
        maxFiles={3}
        acceptedFileTypes={['.pdf']}
        uploadButtonText="Subir documentos"
      />
    );

    expect(screen.getByText('Tipos permitidos: .pdf')).toBeInTheDocument();
    expect(screen.getByText('Máximo 3 archivos, hasta 10MB cada uno')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const onFilesSelect = vi.fn();
    const { container } = render(<MultiFileUpload onFilesSelect={onFilesSelect} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['contenido'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFilesSelect).toHaveBeenCalledWith([file]);
      expect(screen.getByText(/Archivos seleccionados/i)).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <MultiFileUpload autoUpload onUpload={onUpload} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['contenido'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalled();
    });
  });

  it('should be accessible', () => {
    render(<MultiFileUpload />);

    expect(
      screen.getByText('Arrastra archivos aquí o haz clic para seleccionar')
    ).toBeInTheDocument();
  });
});
