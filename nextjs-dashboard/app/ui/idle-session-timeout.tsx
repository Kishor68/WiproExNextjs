'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export default function IdleSessionTimeout() {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearIdleTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };

    const startIdleTimer = () => {
      clearIdleTimer();
      timeoutRef.current = window.setTimeout(() => {
        signOut({
          redirectTo: '/login?notification=session-expired',
        });
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, startIdleTimer, { passive: true });
    });
    startIdleTimer();

    return () => {
      clearIdleTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startIdleTimer);
      });
    };
  }, []);

  return null;
}
