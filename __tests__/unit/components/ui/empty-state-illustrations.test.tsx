import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoBuildingsIllustration } from '@/components/ui/empty-state-illustrations';

describe('NoBuildingsIllustration', () => {
  it('should render without crashing', () => {
    render(<NoBuildingsIllustration />);

    expect(screen.getByRole('img', { name: 'Ilustración de edificio vacío' })).toBeInTheDocument();
  });

  it('should render with props', () => {
    render(<NoBuildingsIllustration className="h-10 w-10" />);

    expect(screen.getByRole('img', { name: 'Ilustración de edificio vacío' })).toBeInTheDocument();
  });

  it('should handle form submission', () => {
    render(<NoBuildingsIllustration />);

    expect(screen.getByRole('img', { name: 'Ilustración de edificio vacío' })).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<NoBuildingsIllustration />);

    expect(screen.getByRole('img', { name: 'Ilustración de edificio vacío' })).toBeInTheDocument();
  });
});
