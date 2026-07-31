import { useCallback, useEffect, useRef, useState } from 'react';

const TIMER_SECONDS = 60;

export function useResendTimer() {
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runCountdown = useCallback(
    (from: number) => {
      stop();
      let remaining = from;

      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setSeconds(remaining);

        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      }, 1000);
    },
    [stop],
  );

  const start = useCallback(() => {
    setSeconds(TIMER_SECONDS);
    runCountdown(TIMER_SECONDS);
  }, [runCountdown]);

  const reset = useCallback(() => {
    stop();
    setSeconds(TIMER_SECONDS);
  }, [stop]);

  useEffect(() => {
    runCountdown(TIMER_SECONDS);
    return stop;
  }, [runCountdown, stop]);

  return { seconds, start, reset };
}

export function formatResendCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
