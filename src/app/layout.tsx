import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';

export const metadata: Metadata = {
  title: 'IB Examiner • Senior Examiner Assessment & Socratic Tutoring',
  description:
    'Authentic IB examination revision, timed mock exams with handwritten working overlays, and Socratic tutoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#faf9f5] text-[#141413] selection:bg-[#cc785c]/20 selection:text-[#141413]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
