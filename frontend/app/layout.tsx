import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'InterviAI | Adaptive AI Interview & Candidate Intelligence',
  description: 'AI-powered adaptive technical interviews, project defense, and candidate intelligence platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#070b12] text-slate-100 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
