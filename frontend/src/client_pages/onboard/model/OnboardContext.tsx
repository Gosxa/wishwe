'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useOnboard } from './useOnboard';

type OnboardContextValue = ReturnType<typeof useOnboard>;

const OnboardContext = createContext<OnboardContextValue | null>(null);

export const useOnboardContext = () => {
  const ctx = useContext(OnboardContext);

  if (!ctx)
    throw new Error('useOnboardContext must be used within OnboardProvider');

  return ctx;
};

type Props = {
  total: number;
  children: ReactNode;
};

export const OnboardProvider = ({ total, children }: Props) => {
  const value = useOnboard(total);

  return (
    <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
  );
};
