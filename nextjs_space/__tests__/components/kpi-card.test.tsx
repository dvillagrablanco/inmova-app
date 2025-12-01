import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/ui/kpi-card';
import { DollarSign } from 'lucide-react';

describe('KPICard Component', () => {
  it('should render title and value', () => {
    render(
      <KPICard
        title="Ingresos Totales"
        value="€15,234"
        icon={DollarSign}
      />
    );
    
    expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
    expect(screen.getByText('€15,234')).toBeInTheDocument();
  });

  it('should show positive trend in green', () => {
    render(
      <KPICard
        title="Revenue"
        value="100"
        trend={{ value: 12.5, isPositive: true }}
        icon={DollarSign}
      />
    );
    
    const trendElement = screen.getByText('+12.5%');
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass('text-green-600');
  });

  it('should show negative trend in red', () => {
    render(
      <KPICard
        title="Revenue"
        value="100"
        trend={{ value: 5.2, isPositive: false }}
        icon={DollarSign}
      />
    );
    
    const trendElement = screen.getByText('-5.2%');
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass('text-red-600');
  });

  it('should not render trend when not provided', () => {
    render(
      <KPICard
        title="Revenue"
        value="100"
        icon={DollarSign}
      />
    );
    
    const container = screen.getByText('Revenue').closest('div');
    expect(container?.textContent).not.toMatch(/%/);
  });
});
