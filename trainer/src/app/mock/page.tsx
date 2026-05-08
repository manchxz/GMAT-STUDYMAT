import Link from 'next/link';

export default function MockExamPage() {
  return (
    <div className="theme-vue flex min-h-screen flex-col bg-[color:var(--bg)] font-sans text-[color:var(--ink)]">
      <PearsonRibbon />
      <main className="relative flex flex-1 flex-col">
        <div className="border-b px-12 py-4" style={{ borderColor: 'var(--border)' }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-[color:var(--muted)]">
            Test-center style layout · unofficial practice shell
          </p>
          <h1 className="mt-2 text-xl font-semibold">
            Graduate Management Admission Test™ — Practice Shell
          </h1>
        </div>

        <div className="mx-auto mt-14 w-full max-w-4xl px-6">
          <div className="rounded border bg-[color:var(--panel)] p-16 shadow-xl" style={{ borderColor: 'var(--border)' }}>
            <p className="text-center font-mono text-sm tracking-[0.4em] text-[color:var(--muted)]">QUESTION 12 / 79</p>
            <p className="mt-14 text-lg leading-relaxed">
              Practice layout with high-contrast surfaces for long sessions. Question content is supplied by your routing layer and item bank.
            </p>
            <div className="mt-12 flex justify-center gap-12">
              <button
                type="button"
                className="rounded border px-14 py-3 font-semibold"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                Next
              </button>
              <button
                type="button"
                className="rounded border px-14 py-3 font-semibold text-[color:var(--muted)]"
                style={{ borderColor: 'var(--border)' }}
              >
                Mark for review
              </button>
            </div>
          </div>

          <p className="mt-10 pb-28 text-center text-[color:var(--muted)] text-xs">
            <Link href="/study">← Back to study</Link>
          </p>
        </div>
      </main>
      <PearsonRibbonBottom />
    </div>
  );
}

function PearsonRibbon() {
  return (
    <header className="flex items-center justify-between border-b bg-[color:var(--panel)] px-6 py-3" style={{ borderColor: 'var(--border)' }}>
      <div className="font-mono text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">GMAT™</div>
      <div className="font-mono text-sm tabular-nums">Time remaining — 62:41</div>
      <button type="button" className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">
        Hide
      </button>
    </header>
  );
}

function PearsonRibbonBottom() {
  return (
    <footer className="sticky bottom-0 border-t bg-[color:var(--panel)] px-8 py-3 text-[color:var(--muted)] text-xs" style={{ borderColor: 'var(--border)' }}>
      System check complete · Use full screen for best fidelity.
    </footer>
  );
}
