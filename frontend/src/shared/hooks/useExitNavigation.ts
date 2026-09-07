'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { useRouter } from 'next/navigation';

export type UseExitNavigationOptions = {
  duration?: number;
  onNavigate?: () => void;
};

export const DEFAULT_EXIT_DURATION = 320;

export const useExitNavigation = (
  targetPath: string,
  options?: UseExitNavigationOptions,
) => {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const isLeavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = options?.duration ?? DEFAULT_EXIT_DURATION;
  const onNavigateRef = useRef(options?.onNavigate);

  useEffect(() => {
    onNavigateRef.current = options?.onNavigate;
  }, [options?.onNavigate]);

  useEffect(() => {
    router.prefetch?.(targetPath);
  }, [router, targetPath]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleNavigate = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const isModifiedClick =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey;

      if (isModifiedClick) return;

      event.preventDefault();

      if (isLeavingRef.current) return;

      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        onNavigateRef.current?.();
        router.push?.(targetPath);

        return;
      }

      isLeavingRef.current = true;
      setIsLeaving(true);
      timerRef.current = setTimeout(() => {
        onNavigateRef.current?.();
        router.push?.(targetPath);
      }, duration);
    },
    [duration, router, targetPath],
  );

  return {
    handleNavigate,
    isLeaving,
  };
};
