import { redirect } from 'next/navigation';

// Redirige a la página de coliving en módulos
export default function ColivingPage() {
  redirect('/landing/modulos/coliving');
}
