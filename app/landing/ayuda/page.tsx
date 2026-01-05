import { redirect } from 'next/navigation';

// Redirige a FAQ
export default function AyudaPage() {
  redirect('/landing/faq');
}
