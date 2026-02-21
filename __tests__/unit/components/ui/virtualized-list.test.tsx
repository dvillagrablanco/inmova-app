import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualizedList } from '@/components/ui/virtualized-list';
describe('VirtualizedList', () => {
  it('renders with empty items', () => {
    const { container } = render(
      <VirtualizedList items={[]} itemHeight={40} renderRow={({index, style}: any) => <div key={index} style={style}>Row</div>} />
    );
    expect(container).toBeTruthy();
  });
});
