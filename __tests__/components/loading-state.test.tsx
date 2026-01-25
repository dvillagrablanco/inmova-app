import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state';

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    // El texto aparece en múltiples elementos (sr-only y visible)
    const elements = screen.getAllByText('Cargando...');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Loading data" />);
    // El texto aparece en múltiples elementos (sr-only y visible)
    const elements = screen.getAllByText('Loading data');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('applies fullScreen class when fullScreen prop is true', () => {
    const { container } = render(<LoadingState fullScreen />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).toHaveClass('fixed');
    expect(loadingDiv).toHaveClass('inset-0');
  });

  it('renders LoadingSpinner component', () => {
    const { container } = render(<LoadingSpinner />);
    // El spinner usa un div con animate-spin, no SVG
    expect(container.querySelector('[role="status"]') || container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
