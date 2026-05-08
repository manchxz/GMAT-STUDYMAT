import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-[color:var(--muted)]">
        Logic Field Guide · Adaptive rail
      </p>
      <h1 className="mt-4 font-semibold text-4xl tracking-tight">
        Train like the test.
        <br />
        Navigate like the web.
      </h1>
      <p className="mt-6 max-w-xl text-[color:var(--muted)] text-lg leading-relaxed">
        Split-pane scaffolding, behavioral error tags, Pearson-style mocks, sprint analytics wired to adaptive routing.
      </p>
      <nav className="mt-14 flex flex-wrap gap-6">
        <Link
          className="rounded-lg bg-[color:var(--accent)] px-8 py-4 font-semibold text-black"
          href="/study"
        >
          Open study cockpit
        </Link>
        <Link
          className="rounded-lg border px-8 py-4 font-semibold"
          href="/mock"
          style={{ borderColor: 'var(--border)' }}
        >
          Mock shell (Pearson-esque)
        </Link>
      </nav>
      <footer className="mt-28 border-t pt-10 text-[color:var(--muted)] text-xs" style={{ borderColor: 'var(--border)' }}>
        Backend schema + routers live under <span className="font-mono">trainer/prisma</span> and{' '}
        <span className="font-mono">trainer/src/lib/</span>.
      </footer>
    </main>
  );
}
