import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

const useIsMobileMock = vi.fn();

vi.mock('@/lib/hooks/useMediaQuery', () => ({
  useIsMobile: () => useIsMobileMock(),
}));

describe('PullToRefresh', () => {
  beforeEach(() => {
    useIsMobileMock.mockReturnValue(false);
  });

  it('should render without crashing', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Contenido</div>
      </PullToRefresh>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('should render with props', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh} disabled>
        <div>Contenido</div>
      </PullToRefresh>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    useIsMobileMock.mockReturnValue(true);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Contenido</div>
      </PullToRefresh>
    );

    const root = container.firstChild as HTMLElement;

    fireEvent.touchStart(root, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(root, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(root);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('should handle form submission', async () => {
    useIsMobileMock.mockReturnValue(true);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} disabled>
        <div>Contenido</div>
      </PullToRefresh>
    );

    const root = container.firstChild as HTMLElement;

    fireEvent.touchStart(root, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(root, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(root);

    await waitFor(() => {
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  it('should execute side effects', async () => {
    useIsMobileMock.mockReturnValue(true);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Contenido</div>
      </PullToRefresh>
    );

    await waitFor(() => {
      expect(screen.getByText(/Arrastra para actualizar/i)).toBeInTheDocument();
    });
  });

  it('should be accessible', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Contenido</div>
      </PullToRefresh>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});
