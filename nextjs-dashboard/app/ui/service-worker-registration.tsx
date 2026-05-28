'use client';

import { useEffect } from 'react';

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) {
      console.log('Service worker already registered:', existing.scope);
      return existing;
    }
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    throw error;
  }
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Try to register immediately on mount
    registerSW().catch(() => {});

    // Also attempt re-registration when window gains focus (useful after DevTools unregister)
    const onFocus = () => registerSW().catch(() => {});
    window.addEventListener('focus', onFocus);

    // Expose a helper for manual re-registration from the console:
    // Run `window.reRegisterServiceWorker()` in the browser console.
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.reRegisterServiceWorker = registerSW;
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete window.reRegisterServiceWorker;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return null;
}

