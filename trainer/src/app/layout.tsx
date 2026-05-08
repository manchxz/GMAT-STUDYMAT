import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { InterSans, JetMono } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Logic Field Guide — GMAT Focus Prep',
  description:
    'GMAT™ Focus prep: guided practice, course textbook, and a full-length timed practice test—all in one place.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${InterSans.variable} ${JetMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
        <footer
          className="border-t px-6 py-8 text-center text-xs text-[color:var(--muted)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <Link href="/privacy" className="font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline">
            Privacy
          </Link>
          <span className="mx-2 opacity-40">·</span>
          <span>Unofficial GMAT™ Focus prep—not affiliated with GMAC.</span>
        </footer>
      </body>
    </html>
  );
}
