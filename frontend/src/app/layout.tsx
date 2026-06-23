import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Instrument_Serif, Poppins } from 'next/font/google';
import { GlobalLoader } from '@/shared/ui/globalLoader/GlobalLoader';
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

export const metadata: Metadata = {
  title: 'WishWe',
  description: 'Share your wishes',
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
      </body>
    </html>
  );
}
