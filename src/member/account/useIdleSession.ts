import { useCallback, useEffect, useRef, useState } from 'react';

const WARN_MS = 120_000;

/**
 * Keeps the page honest about the server's idle timer. The server moves the end of a session on
 * each call it receives, so `touch()` is called after every successful call. Two minutes before
 * the end (a third of the time, on a shared device's short session) a warning appears; `stay`
 * makes one call to keep the session, and the page signs out when the time is up.
 */
export function useIdleSession({
  lengthSeconds,
  onExpire,
  keepAlive,
}: {
  /** The idle length the server gave at sign in. */
  lengthSeconds: number;
  onExpire: () => void;
  keepAlive: () => Promise<unknown>;
}) {
  const lengthMs = lengthSeconds * 1000;
  const warnMs = Math.min(WARN_MS, lengthMs / 3);
  const endsAt = useRef(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  const touch = useCallback(() => {
    endsAt.current = Date.now() + lengthMs;
    setSecondsLeft(null);
  }, [lengthMs]);

  useEffect(() => {
    endsAt.current = Date.now() + lengthMs;
    const timer = setInterval(() => {
      const left = endsAt.current - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        expire.current();
      } else {
        setSecondsLeft(left <= warnMs ? Math.ceil(left / 1000) : null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lengthMs, warnMs]);

  const stay = useCallback(async () => {
    try {
      await keepAlive();
      touch();
    } catch {
      // The server says the session is over; the next tick signs the person out.
    }
  }, [keepAlive, touch]);

  return { secondsLeft, touch, stay };
}
