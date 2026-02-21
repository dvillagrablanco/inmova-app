import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/ui/empty-state';
import { Building2 } from 'lucide-react';

describe('EmptyState', () => {
  it('renders with icon, title, and description', () => {
    render(
      <EmptyState
        icon={<Building2 className="h-16 w-16" />}
        title="No buildings found"
        description="Start by creating your first building"
      />
    );
    
    expect(screen.getByText('No buildings found')).toBeInTheDocument();
    expect(screen.getByText('Start by creating your first building')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const mockAction = vi.fn();
    render(
      <EmptyState
        icon={<Building2 className="h-16 w-16" />}
        title="No buildings found"
        description="Start by creating your first building"
        action={{
          label: 'Create Building',
          onClick: mockAction,
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: /create building/i });
    expect(button).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();
    render(
      <EmptyState
        icon={<Building2 className="h-16 w-16" />}
        title="No buildings found"
        description="Start by creating your first building"
        action={{
          label: 'Create Building',
          onClick: mockAction,
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: /create building/i });
    await user.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
