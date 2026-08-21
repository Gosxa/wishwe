import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Instrument_Serif, Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { GlobalLoader } from '@/shared/ui/globalLoader/GlobalLoader';
import { buildMetadata, SITE_URL } from '@/shared/lib/metadata';
import './globals.scss';

const skModernist = localFont({
  src: [
    {
      path: '../../public/fonts/Sk-Modernist-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Sk-Modernist-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sk-modernist',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: 'normal',
  variable: '--font-poppins',
});

// Defaults for every route. Pages that are reached by a shared link override
// the share copy; everything else inherits this.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildMetadata({
    title: 'WishWe — see faces, not screens',
    description:
      'Share an idea, see who’s down to join, and actually meet up — without endless group chats.',
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${skModernist.variable} ${instrumentSerif.variable} ${poppins.variable}`}
    >
      <body>
        <GlobalLoader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
