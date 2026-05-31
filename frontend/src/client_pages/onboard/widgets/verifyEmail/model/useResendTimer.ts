import { useCallback, useEffect, useRef, useState } from 'react';

const TIMER_SECONDS = 60;

export const useResendTimer = () => {
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    let remaining = TIMER_SECONDS;

    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 1000);
  }, []);

  const start = useCallback(() => {
    setSeconds(TIMER_SECONDS);
    startInterval();
  }, [startInterval]);

  const reset = useCallback(() => {
    stop();
    setSeconds(TIMER_SECONDS);
  }, [stop]);

  useEffect(() => {
    startInterval();

    return stop;
  }, [startInterval, stop]);

  return { seconds, start, reset };
};
