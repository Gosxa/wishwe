'use client';

import { useEffect } from 'react';

let lockCount = 0;
let release: (() => void) | null = null;

const lockDocument = () => {
  const body = document.body;
  const root = document.documentElement;
  const scrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - root.clientWidth;
  const paddingRight = parseFloat(getComputedStyle(body).paddingRight) || 0;

  const previous = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    paddingRight: body.style.paddingRight,
    scrollBehavior: root.style.scrollBehavior,
  };

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
  }

  return () => {
    body.style.position = previous.position;
    body.style.top = previous.top;
    body.style.left = previous.left;
    body.style.right = previous.right;
    body.style.paddingRight = previous.paddingRight;

    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollY);
    root.style.scrollBehavior = previous.scrollBehavior;
  };
};

export const useBodyScrollLock = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    if (lockCount === 0) release = lockDocument();

    lockCount += 1;

    return () => {
      lockCount -= 1;

      if (lockCount === 0) {
        release?.();
        release = null;
      }
    };
  }, [enabled]);
};
