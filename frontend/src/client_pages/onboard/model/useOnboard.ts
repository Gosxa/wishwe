import { useState, useCallback, useEffect, useRef } from 'react';

export const useOnboard = (total: number) => {
  const [step, setStep] = useState(0);
  const VPRef = useRef<HTMLDivElement>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  const registerScreen = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      screenRefs.current[index] = el;
    },
    [],
  );

  const next = useCallback(() => {
    setStep(s => Math.min(s + 1, total - 1));
  }, [total]);

  const prev = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setStep(Math.max(0, Math.min(index, total - 1)));
    },
    [total],
  );

  useEffect(() => {
    if (!VPRef.current) {
      return;
    }

    VPRef.current.style.transform = `translateX(-${step * 440}px)`;
  }, [step]);

  return { step, next, prev, goTo, total, VPRef, screenRefs, registerScreen };
};
