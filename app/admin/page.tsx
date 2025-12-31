import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redirect to admin dashboard
  redirect('/admin/dashboard');
}
