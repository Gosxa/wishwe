'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

export const useScrollLock = (overlayRef: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const node = overlayRef.current;

    if (!node) return;

    const block = (event: Event) => event.preventDefault();

    node.addEventListener('wheel', block, { passive: false });
    node.addEventListener('touchmove', block, { passive: false });

    return () => {
      node.removeEventListener('wheel', block);
      node.removeEventListener('touchmove', block);
    };
  }, [overlayRef]);
};
