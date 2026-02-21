import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';
describe('StatusBadge', () => {
  it('renders success badge', () => {
    render(<StatusBadge status="success" label="Active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
  it('renders error badge', () => {
    render(<StatusBadge status="error" label="Failed" />);
    expect(screen.getByText('Failed')).toBeTruthy();
  });
  it('renders warning badge', () => {
    render(<StatusBadge status="warning" label="Pending" />);
    expect(screen.getByText('Pending')).toBeTruthy();
  });
});
