import { redirect } from 'next/navigation';

/**
 * Página raíz de eWoorker
 * Redirige a la landing page
 */
export default function EwoorkerPage() {
  redirect('/ewoorker/landing');
}
