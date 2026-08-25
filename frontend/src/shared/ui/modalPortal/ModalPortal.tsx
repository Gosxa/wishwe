'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

const getSnapshot = () => false;
const getServerSnapshot = () => true;

export const ModalPortal = ({ children }: { children: ReactNode }) => {
  const isServer = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (isServer) return null;

  return createPortal(children, document.body);
};
