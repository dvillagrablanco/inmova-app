import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
describe('ProgressIndicator', () => {
  it('renders with steps', () => {
    const { container } = render(<ProgressIndicator steps={[{id: '1', label: 'Step 1'}]} />);
    expect(container).toBeTruthy();
  });
  it('renders empty', () => {
    const { container } = render(<ProgressIndicator steps={[]} />);
    expect(container).toBeTruthy();
  });
});
