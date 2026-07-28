'use client';

import { createContext, useContext, type ReactNode } from 'react';

const NextPathCtx = createContext<string | null>(null);

export const useNextPath = () => useContext(NextPathCtx);

type Props = {
  next?: string | null;
  children: ReactNode;
};

export const NextPathProvider = ({ next, children }: Props) => (
  <NextPathCtx value={next ?? null}>{children}</NextPathCtx>
);
