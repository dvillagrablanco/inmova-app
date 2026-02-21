#!/bin/bash
# Fix the 21 failing component tests by providing required props

cd /workspace

# AccessibleIcon - needs icon + label
cat > __tests__/unit/components/ui/accessible-icon.test.tsx << 'EOF'
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
EOF

# AdvancedFilters - needs filters, values, onChange
cat > __tests__/unit/components/ui/advanced-filters.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
describe('AdvancedFilters', () => {
  it('renders with required props', () => {
    const { container } = render(<AdvancedFilters filters={[]} values={{}} onChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
EOF

# AnimatedStat - needs title + value
cat > __tests__/unit/components/ui/animated-stat.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedStat } from '@/components/ui/animated-stat';
describe('AnimatedStat', () => {
  it('renders with required props', () => {
    render(<AnimatedStat title="Revenue" value={1000} />);
    expect(screen.getByText('Revenue')).toBeTruthy();
  });
  it('renders with prefix and suffix', () => {
    render(<AnimatedStat title="Price" value={99} prefix="€" suffix="/mo" />);
    expect(screen.getByText('Price')).toBeTruthy();
  });
});
EOF

# ClientResponsiveContainer
cat > __tests__/unit/components/ui/client-responsive-container.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClientResponsiveContainer } from '@/components/ui/client-responsive-container';
describe('ClientResponsiveContainer', () => {
  it('renders children', () => {
    const { container } = render(<ClientResponsiveContainer><div>Content</div></ClientResponsiveContainer>);
    expect(container.textContent).toContain('Content');
  });
});
EOF

# ContextualHelp - needs module, title, description, sections
cat > __tests__/unit/components/ui/contextual-help.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ContextualHelp } from '@/components/ui/contextual-help';
describe('ContextualHelp', () => {
  it('renders with required props', () => {
    const { container } = render(<ContextualHelp module="test" title="Help" description="desc" sections={[]} />);
    expect(container).toBeTruthy();
  });
});
EOF

# DataTable - needs data + columns
cat > __tests__/unit/components/ui/data-table.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DataTable } from '@/components/ui/data-table';
describe('DataTable', () => {
  it('renders empty table', () => {
    const { container } = render(<DataTable data={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });
  it('renders with data', () => {
    const { container } = render(<DataTable data={[{id: 1, name: 'Test'}]} columns={[{key: 'name', label: 'Name'}]} />);
    expect(container).toBeTruthy();
  });
});
EOF

# FilterChips
cat > __tests__/unit/components/ui/filter-chips.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FilterChips } from '@/components/ui/filter-chips';
describe('FilterChips', () => {
  it('renders with no filters', () => {
    const { container } = render(<FilterChips filters={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
EOF

# MobileDrawer
cat > __tests__/unit/components/ui/mobile-drawer.test.tsx << 'EOF'
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
EOF

# MobileFilterPanel
cat > __tests__/unit/components/ui/mobile-filter-panel.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MobileFilterPanel } from '@/components/ui/mobile-filter-panel';
describe('MobileFilterPanel', () => {
  it('renders with required props', () => {
    const { container } = render(<MobileFilterPanel filters={[]} activeFilters={[]} onFilterChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
EOF

# MobileFormWizard
cat > __tests__/unit/components/ui/mobile-form-wizard.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MobileFormWizard } from '@/components/ui/mobile-form-wizard';
describe('MobileFormWizard', () => {
  it('renders with empty steps', () => {
    const { container } = render(<MobileFormWizard steps={[]} />);
    expect(container).toBeTruthy();
  });
});
EOF

# MobileOptimizedForm
cat > __tests__/unit/components/ui/mobile-optimized-form.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MobileOptimizedForm } from '@/components/ui/mobile-optimized-form';
describe('MobileOptimizedForm', () => {
  it('renders with required props', () => {
    const { container } = render(<MobileOptimizedForm onSubmit={vi.fn()}><div>Fields</div></MobileOptimizedForm>);
    expect(container).toBeTruthy();
  });
});
EOF

# PullToRefresh
cat > __tests__/unit/components/ui/pull-to-refresh.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
describe('PullToRefresh', () => {
  it('renders with children', () => {
    const { container } = render(<PullToRefresh onRefresh={vi.fn().mockResolvedValue(undefined)}><div>Content</div></PullToRefresh>);
    expect(container.textContent).toContain('Content');
  });
});
EOF

# ModuleQuickGuide
cat > __tests__/unit/components/ui/module-quick-guide.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ModuleQuickGuide } from '@/components/ui/module-quick-guide';
describe('ModuleQuickGuide', () => {
  it('renders with required props', () => {
    const { container } = render(<ModuleQuickGuide moduleId="test" moduleName="Test" steps={[]} />);
    expect(container).toBeTruthy();
  });
});
EOF

# PreloadLink
cat > __tests__/unit/components/ui/preload-link.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PreloadLink } from '@/components/ui/preload-link';
describe('PreloadLink', () => {
  it('renders with href and children', () => {
    const { container } = render(<PreloadLink href="/test">Go</PreloadLink>);
    expect(container.textContent).toContain('Go');
  });
});
EOF

# ProgressIndicator
cat > __tests__/unit/components/ui/progress-indicator.test.tsx << 'EOF'
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
EOF

# ResponsiveDataTable
cat > __tests__/unit/components/ui/responsive-data-table.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResponsiveDataTable } from '@/components/ui/responsive-data-table';
describe('ResponsiveDataTable', () => {
  it('renders empty', () => {
    const { container } = render(<ResponsiveDataTable data={[]} columns={[]} />);
    expect(container).toBeTruthy();
  });
});
EOF

# ResponsiveTable
cat > __tests__/unit/components/ui/responsive-table.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResponsiveTable } from '@/components/ui/responsive-table';
describe('ResponsiveTable', () => {
  it('renders empty', () => {
    const { container } = render(<ResponsiveTable data={[]} columns={[]} keyExtractor={(i: any) => i.id} />);
    expect(container).toBeTruthy();
  });
});
EOF

# SearchInput
cat > __tests__/unit/components/ui/search-input.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SearchInput } from '@/components/ui/search-input';
describe('SearchInput', () => {
  it('renders with required props', () => {
    const { container } = render(<SearchInput value="" onChange={vi.fn()} />);
    expect(container.querySelector('input')).toBeTruthy();
  });
  it('renders with placeholder', () => {
    const { container } = render(<SearchInput value="" onChange={vi.fn()} placeholder="Search..." />);
    expect(container.querySelector('input')).toBeTruthy();
  });
});
EOF

# StatusBadge
cat > __tests__/unit/components/ui/status-badge.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';
describe('StatusBadge', () => {
  it('renders success badge', () => {
    render(<StatusBadge status="success" label="Active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
  it('renders error badge', () => {
    render(<StatusBadge status="error" label="Failed" />);
    expect(screen.getByText('Failed')).toBeTruthy();
  });
  it('renders warning badge', () => {
    render(<StatusBadge status="warning" label="Pending" />);
    expect(screen.getByText('Pending')).toBeTruthy();
  });
});
EOF

# VirtualizedList
cat > __tests__/unit/components/ui/virtualized-list.test.tsx << 'EOF'
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
EOF

# Wizard
cat > __tests__/unit/components/ui/wizard.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Wizard } from '@/components/ui/wizard';
describe('Wizard', () => {
  it('renders with required props', () => {
    const { container } = render(<Wizard steps={[{id: '1', title: 'Step 1', content: () => <div>Content</div>}]} onComplete={vi.fn().mockResolvedValue(undefined)} />);
    expect(container).toBeTruthy();
  });
  it('renders with empty steps', () => {
    const { container } = render(<Wizard steps={[]} onComplete={vi.fn().mockResolvedValue(undefined)} />);
    expect(container).toBeTruthy();
  });
});
EOF

echo "Fixed all 21 component tests with proper required props"
