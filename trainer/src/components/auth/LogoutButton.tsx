'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        router.push('/');
        router.refresh();
      }}
      className="rounded-lg border px-4 py-2 text-sm font-semibold"
      style={{ borderColor: 'var(--border)' }}
    >
      Sign out
    </button>
  );
}
