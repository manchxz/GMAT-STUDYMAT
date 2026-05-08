import Link from 'next/link';
import { ThemeSwitcher } from '@/components/system/ThemeSwitcher';

export const metadata = {
  title: 'Privacy — Logic Field Guide',
  description: 'How the GMAT Focus Trainer handles your account data.',
};

export default function PrivacyPage() {
  return (
    <>
      <header
        className="sticky top-0 z-40 border-b bg-[color:var(--bg)]/90 px-4 py-4 backdrop-blur"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.35em] opacity-70">
            ← Home
          </Link>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12 text-[color:var(--ink)]">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
          <strong className="text-[color:var(--ink)]">Logic Field Guide / GMAT Focus Trainer</strong> stores the minimum
          needed to run your prep: account details you provide, progress in the textbook and study lab, diagnostic
          results, and optional practice-test summaries saved in your browser.
        </p>
        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-relaxed text-[color:var(--muted)]">
          <li>
            <strong className="text-[color:var(--ink)]">Account.</strong> Email (and optional phone) are used for sign-in
            and verification. Passwords are hashed; we do not store them in plain text.
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Practice data.</strong> Question attempts, skill estimates, and
            error tags you log help personalize drills and appear in your review hub.
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Third parties.</strong> Email and SMS codes may be delivered
            through providers you configure (for example Resend or Twilio). Their policies apply to those messages.
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Cookies.</strong> Session cookies keep you signed in. Theme and
            minor UI preferences may be stored locally.
          </li>
          <li>
            <strong className="text-[color:var(--ink)]">Practice tests.</strong> Full-question review for mocks is stored
            in this browser unless you export or sync it elsewhere—it does not replace an official GMAC score report.
          </li>
        </ul>
        <p className="mt-8 text-sm text-[color:var(--muted)]">
          This product is not affiliated with GMAC or Pearson VUE. For questions about this policy, contact the operator
          of your deployment.
        </p>
      </main>
    </>
  );
}
