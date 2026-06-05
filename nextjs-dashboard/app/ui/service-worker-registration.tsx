'use client';

import { useEffect } from 'react';

type WindowWithServiceWorkerHelper = typeof window & {
  reRegisterServiceWorker?: typeof registerSW;
};

async function cleanupDevelopmentSW() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('acme-dashboard-'))
        .map((cacheName) => caches.delete(cacheName)),
    );
  }
}

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
    if (process.env.NODE_ENV !== 'production') {
      cleanupDevelopmentSW().catch((error) => {
        console.error('Development service worker cleanup failed:', error);
      });
      return;
    }

    // Try to register immediately on mount
    registerSW().catch(() => {});

    // Also attempt re-registration when window gains focus (useful after DevTools unregister)
    const onFocus = () => registerSW().catch(() => {});
    window.addEventListener('focus', onFocus);

    // Expose a helper for manual re-registration from the console:
    // Run `window.reRegisterServiceWorker()` in the browser console.
    try {
      (window as WindowWithServiceWorkerHelper).reRegisterServiceWorker =
        registerSW;
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      try {
        delete (window as WindowWithServiceWorkerHelper)
          .reRegisterServiceWorker;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return null;
}

