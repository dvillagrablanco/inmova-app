/**
 * Página de comunidad
 * Redirige a /dashboard/community
 */

import { redirect } from 'next/navigation';

export default function CommunityPage() {
  redirect('/dashboard/community');
}
