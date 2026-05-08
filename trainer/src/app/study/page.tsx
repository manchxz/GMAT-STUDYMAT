import { SplitPaneStudy } from '@/components/study/SplitPaneStudy';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';
import Link from 'next/link';
import { DEMO_QUESTIONS } from '@/lib/demo-questions';

export default function StudyPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.35em] opacity-70">
            ← Home
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
              Zero-struggle layout
            </span>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <SplitPaneStudy question={DEMO_QUESTIONS[0]} recentAccuracy={0.58} />
    </>
  );
}
