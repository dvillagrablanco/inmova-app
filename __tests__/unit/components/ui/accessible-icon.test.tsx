import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AccessibleIcon } from '@/components/ui/accessible-icon';
import { Home } from 'lucide-react';
describe('AccessibleIcon', () => {
  it('renders with required props', () => {
    const { container } = render(<AccessibleIcon icon={Home} label="Home" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
  it('renders as decorative', () => {
    const { container } = render(<AccessibleIcon icon={Home} label="Home" decorative />);
    expect(container).toBeTruthy();
  });
});
