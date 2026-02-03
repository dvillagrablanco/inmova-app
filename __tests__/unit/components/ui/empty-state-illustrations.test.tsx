import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoBuildingsIllustration } from '@/components/ui/empty-state-illustrations';

describe('NoBuildingsIllustration', () => {
  it('renderiza la ilustración con label accesible', () => {
    render(<NoBuildingsIllustration />);

    expect(screen.getByRole('img', { name: /ilustración de edificio vacío/i })).toBeInTheDocument();
  });

  it('acepta className personalizado', () => {
    render(<NoBuildingsIllustration className="custom-class" />);

    const illustration = screen.getByRole('img', {
      name: /ilustración de edificio vacío/i,
    });
    expect(illustration).toHaveClass('custom-class');
  });
});
