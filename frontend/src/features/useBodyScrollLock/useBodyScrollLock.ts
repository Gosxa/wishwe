'use client';

import { useEffect } from 'react';

let lockCount = 0;
let restoreOverflow = '';

export const useBodyScrollLock = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    if (lockCount === 0) {
      restoreOverflow = document.body.style.overflow;

      document.body.style.overflow = 'hidden';
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;

      if (lockCount === 0) {
        document.body.style.overflow = restoreOverflow;
      }
    };
  }, [enabled]);
};
