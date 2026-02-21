import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MobileDrawer } from '@/components/ui/mobile-drawer';
describe('MobileDrawer', () => {
  it('renders when open', () => {
    const { container } = render(<MobileDrawer isOpen={true} onClose={vi.fn()}><div>Content</div></MobileDrawer>);
    expect(container).toBeTruthy();
  });
  it('renders closed', () => {
    const { container } = render(<MobileDrawer isOpen={false} onClose={vi.fn()}><div>Content</div></MobileDrawer>);
    expect(container).toBeTruthy();
  });
});
