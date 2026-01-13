'use client';

/**
 * Document Onboarding Page
 * 
 * Página principal para el onboarding con documentos
 * 
 * @module app/onboarding/documents/page
 */

import { DocumentOnboardingWizard } from '@/components/onboarding/DocumentOnboardingWizard';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useRouter } from 'next/navigation';

export default function DocumentOnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard?onboarding=complete');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <AuthenticatedLayout maxWidth="6xl">
      <DocumentOnboardingWizard
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </AuthenticatedLayout>
  );
}
