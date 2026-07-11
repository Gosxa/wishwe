'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { InviteContext } from './screensConfig';

const InviteCtx = createContext<InviteContext | null>(null);

export const useInviteContext = () => useContext(InviteCtx);

type Props = {
  invite?: InviteContext;
  children: ReactNode;
};

export const InviteProvider = ({ invite, children }: Props) => (
  <InviteCtx value={invite ?? null}>{children}</InviteCtx>
);
