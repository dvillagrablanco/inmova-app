import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/lib/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
  useMediaQuery: () => false,
  useIsTablet: () => false,
  useIsDesktop: () => true,
  useDeviceType: () => 'desktop',
}));

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <aside>Sidebar</aside>,
}));

vi.mock('@/components/layout/header', () => ({
  Header: () => <header>Header</header>,
}));

vi.mock('@/components/layout/bottom-navigation', () => ({
  BottomNavigation: () => <nav>BottomNavigation</nav>,
}));

vi.mock('@/components/tours/TourAutoStarter', () => ({
  TourAutoStarter: () => <div>TourAutoStarter</div>,
}));

vi.mock('@/components/tours/FloatingTourButton', () => ({
  FloatingTourButton: () => <div>FloatingTourButton</div>,
}));

vi.mock('@/components/help/ContextualHelp', () => ({
  ContextualHelp: () => <div>ContextualHelp</div>,
}));

vi.mock('@/components/tutorials/OnboardingChecklist', () => ({
  OnboardingChecklist: () => <div>OnboardingChecklist</div>,
}));

vi.mock('@/components/tutorials/FirstTimeSetupWizard', () => ({
  FirstTimeSetupWizard: () => <div>FirstTimeSetupWizard</div>,
}));

vi.mock('@/components/navigation/command-palette', () => ({
  CommandPalette: () => <div>CommandPalette</div>,
}));

vi.mock('@/components/navigation/global-shortcuts', () => ({
  GlobalShortcuts: () => <div>GlobalShortcuts</div>,
}));

vi.mock('@/components/navigation/shortcuts-help-dialog', () => ({
  ShortcutsHelpDialog: () => <div>ShortcutsHelpDialog</div>,
}));

vi.mock('@/components/navigation/navigation-tutorial', () => ({
  NavigationTutorial: () => <div>NavigationTutorial</div>,
}));

vi.mock('@/components/accessibility/SkipLink', () => ({
  SkipLink: () => <a href="#main-content">SkipLink</a>,
}));

describe('AuthenticatedLayout', () => {
  it('renderiza el layout con contenido', () => {
    render(
      <AuthenticatedLayout>
        <div>Contenido</div>
      </AuthenticatedLayout>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('aplica maxWidth y containerClassName', () => {
    render(
      <AuthenticatedLayout maxWidth="4xl" containerClassName="custom-container">
        <div>Contenido</div>
      </AuthenticatedLayout>
    );

    const container = screen.getByText('Contenido').parentElement;
    expect(container).toBeTruthy();
    expect(container).toHaveClass('max-w-4xl');
    expect(container).toHaveClass('custom-container');
  });

  it('incluye el skip link accesible', () => {
    render(
      <AuthenticatedLayout>
        <div>Contenido</div>
      </AuthenticatedLayout>
    );

    expect(screen.getByText('SkipLink')).toBeInTheDocument();
  });
});
