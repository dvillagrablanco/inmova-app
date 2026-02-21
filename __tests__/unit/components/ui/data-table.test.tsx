import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DataTable } from '@/components/ui/data-table';
describe('DataTable', () => {
  it('renders empty table', () => {
    const { container } = render(<DataTable data={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });
  it('renders with data', () => {
    const { container } = render(<DataTable data={[{id: 1, name: 'Test'}]} columns={[{key: 'name', header: 'Name', render: (item: any) => item.name}]} />);
    expect(container).toBeTruthy();
  });
});
