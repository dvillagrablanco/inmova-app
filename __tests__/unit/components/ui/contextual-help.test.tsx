import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ContextualHelp } from '@/components/ui/contextual-help';
describe('ContextualHelp', () => {
  it('renders with required props', () => {
    const { container } = render(<ContextualHelp module="test" title="Help" description="desc" sections={[]} />);
    expect(container).toBeTruthy();
  });
});
