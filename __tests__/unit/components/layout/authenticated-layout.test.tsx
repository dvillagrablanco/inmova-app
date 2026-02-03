import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div>Sidebar</div>,
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

vi.mock('@/components/accessibility/SkipLink', () => ({
  SkipLink: () => <a href="#main-content">SkipLink</a>,
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

vi.mock('next/dynamic', () => ({
  default: () => () => <div>IntelligentSupportChatbot</div>,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user-1', role: 'super_admin' } },
    status: 'authenticated',
  }),
}));

vi.mock('@/lib/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isNewUser: false, hasCompletedOnboarding: true }),
      })
    );
  });

  it('renderiza el contenido principal', () => {
    render(
      <AuthenticatedLayout>
        <div>Contenido</div>
      </AuthenticatedLayout>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});
