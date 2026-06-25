import { useEffect, useRef, useState } from 'react';

export function useLiveElapsed(startedAt: number | null, active: boolean) {
  const [now, setNow] = useState(Date.now);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active && startedAt) {
      setNow(Date.now());
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, startedAt]);

  return active && startedAt ? now - startedAt : 0;
}
