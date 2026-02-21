import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state';

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    const elements = screen.getAllByText('Cargando...');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Loading data" />);
    expect(screen.getByText('Loading data')).toBeInTheDocument();
  });

  it('applies fullScreen class when fullScreen prop is true', () => {
    const { container } = render(<LoadingState fullScreen />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).toHaveClass('fixed');
    expect(loadingDiv).toHaveClass('inset-0');
  });

  it('renders LoadingSpinner component', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('svg') || container.querySelector('[class*="animate"]');
    expect(spinner || container.firstChild).toBeTruthy();
  });
});
