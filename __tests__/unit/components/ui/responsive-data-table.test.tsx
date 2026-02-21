import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResponsiveDataTable } from '@/components/ui/responsive-data-table';
describe('ResponsiveDataTable', () => {
  it('renders empty', () => {
    const { container } = render(<ResponsiveDataTable data={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });
});
