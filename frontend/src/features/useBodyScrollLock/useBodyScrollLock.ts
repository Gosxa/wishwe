'use client';

import { useEffect } from 'react';

let lockCount = 0;
let restoreBodyOverflow = '';
let restoreRootOverflow = '';

export const useBodyScrollLock = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    if (lockCount === 0) {
      restoreBodyOverflow = document.body.style.overflow;
      restoreRootOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;

      if (lockCount === 0) {
        document.body.style.overflow = restoreBodyOverflow;
        document.documentElement.style.overflow = restoreRootOverflow;
      }
    };
  }, [enabled]);
};
