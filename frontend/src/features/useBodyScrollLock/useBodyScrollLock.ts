'use client';

import { useEffect } from 'react';

let lockCount = 0;
let restoreOverflow = '';
let restorePaddingRight = '';

export const useBodyScrollLock = () => {
  useEffect(() => {
    if (lockCount === 0) {
      restoreOverflow = document.body.style.overflow;
      restorePaddingRight = document.body.style.paddingRight;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;

      if (lockCount === 0) {
        document.body.style.overflow = restoreOverflow;
        document.body.style.paddingRight = restorePaddingRight;
      }
    };
  }, []);
};
