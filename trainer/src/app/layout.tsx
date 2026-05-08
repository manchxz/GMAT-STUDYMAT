import type { Metadata } from 'next';
import './globals.css';
import { InterSans, JetMono } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'GMAT Focus Trainer',
  description: 'GMAT Focus practice with contextual scaffolding and timed items.',
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
