import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MobileFormWizard } from '@/components/ui/mobile-form-wizard';
describe('MobileFormWizard', () => {
  it('renders with empty steps', () => {
    const { container } = render(<MobileFormWizard steps={[]} />);
    expect(container).toBeTruthy();
  });
});
