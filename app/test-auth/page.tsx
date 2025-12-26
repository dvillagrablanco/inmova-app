'use client';

import { useSession } from 'next-auth/react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
