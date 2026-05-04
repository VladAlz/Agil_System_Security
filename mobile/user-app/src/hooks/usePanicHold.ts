import { useCallback, useRef } from 'react';

const HOLD_MS = 3000;

export function usePanicHold(onConfirm: () => void, duration = HOLD_MS) {
  const holding = useRef(false);
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const start = useCallback(() => {
    if (holding.current) return;
    holding.current = true;
    timerId.current = setTimeout(() => {
      if (holding.current) {
        onConfirmRef.current();
      }
      holding.current = false;
    }, duration);
  }, [duration]);

  const cancel = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    if (timerId.current !== null) {
      clearTimeout(timerId.current);
      timerId.current = null;
    }
  }, []);

  return { start, cancel };
}
