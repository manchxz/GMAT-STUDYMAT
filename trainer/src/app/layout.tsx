import type { Metadata } from 'next';
import './globals.css';
import { InterSans, JetMono } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'GMAT Focus Trainer',
  description: 'Adaptive study rail with contextual scaffolding.',
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
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
