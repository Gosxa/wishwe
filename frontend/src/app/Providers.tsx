'use client';

import Script from 'next/script';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export const Providers = ({ children }: Props) => (
  <>
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
    />
    {children}
  </>
);
