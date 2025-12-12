'use client';
export const dynamic = 'force-dynamic';


import { LandingPageContent } from '@/components/landing/LandingPageContent';

// Force dynamic rendering to avoid static export issues

export default function LandingPage() {
  return <LandingPageContent />;
}
