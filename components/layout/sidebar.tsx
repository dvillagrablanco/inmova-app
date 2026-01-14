'use client';

import { useSession } from 'next-auth/react';
import { Sidebar as DefaultSidebar } from '@/components/layout/sidebar';
import { AdaptiveSidebar } from '@/components/adaptive/AdaptiveSidebar';
import { UserProfile } from '@/lib/ui-mode-service';

export function Sidebar() {
  const { data: session } = useSession();

  // If we have a session with user data, use the adaptive sidebar
  if (session?.user) {
    // Construct a UserProfile-like object from session data if available
    // In a real app, this might come from a useUserProfile hook
    const userProfile: UserProfile = {
      uiMode: (session.user as any).uiMode || 'standard',
      experienceLevel: (session.user as any).experienceLevel || 'intermedio',
      techSavviness: (session.user as any).techSavviness || 'medio',
      // Determine vertical from user role or company type
      // Default to general for now
    };

    // Determine vertical (simplified logic)
    const vertical = 'general'; // Could be dynamic based on user profile

    return (
      <div className="hidden lg:flex flex-col w-64 border-r bg-background h-full fixed left-0 top-0 bottom-0 z-30">
        <AdaptiveSidebar 
          vertical={vertical} 
          userProfile={userProfile} 
          className="h-full w-full border-none"
        />
      </div>
    );
  }

  // Fallback to default sidebar
  return <DefaultSidebar />;
}
