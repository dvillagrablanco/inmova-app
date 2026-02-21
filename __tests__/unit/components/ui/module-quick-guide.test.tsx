import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ModuleQuickGuide } from '@/components/ui/module-quick-guide';
describe('ModuleQuickGuide', () => {
  it('renders with required props', () => {
    const { container } = render(<ModuleQuickGuide moduleId="test" moduleName="Test" steps={[]} />);
    expect(container).toBeTruthy();
  });
});
