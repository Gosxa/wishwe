'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type IntroContextValue = {
  isStarted: boolean;
  start: () => void;
};

const IntroContext = createContext<IntroContextValue | null>(null);

export const useIntroContext = () => {
  const ctx = useContext(IntroContext);

  if (!ctx) {
    throw new Error('useIntroContext must be used within IntroProvider');
  }

  return ctx;
};

type Props = {
  children: ReactNode;
};

// Phones and tablets open on an intro sheet that only offers "Get started".
// Tapping it expands the sheet and reveals the sign-in options. Desktop shows
// the options right away and ignores this flag.
export const IntroProvider = ({ children }: Props) => {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <IntroContext value={{ isStarted, start: () => setIsStarted(true) }}>
      {children}
    </IntroContext>
  );
};
