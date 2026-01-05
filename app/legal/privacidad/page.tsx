import { redirect } from 'next/navigation';

// Redirige a la versión en inglés existente
export default function PrivacidadPage() {
  redirect('/legal/privacy');
}
