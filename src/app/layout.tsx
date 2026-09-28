import type { Metadata } from 'next';
import { Public_Sans, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';

const publicSans = Public_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-public-sans' });
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-source-serif',
});
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' });

// Vercel sets the production domain at build time; social images resolve against it.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Criterion • IB exam practice with examiner marking',
  description:
    'Sit IB-style papers under timed conditions, get method-level marking with Error Carried Forward, and practise with a Socratic tutor.',
  applicationName: 'Criterion',
  openGraph: {
    type: 'website',
    siteName: 'Criterion',
    title: 'Criterion • IB exam practice with examiner marking',
    description:
      'Sit IB-style papers under timed conditions, get method-level marking with Error Carried Forward, and practise with a Socratic tutor.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Criterion • IB exam practice with examiner marking',
    description:
      'Sit IB-style papers under timed conditions, get method-level marking with Error Carried Forward, and practise with a Socratic tutor.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-shell text-shell-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
