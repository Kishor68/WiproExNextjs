'use client';

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type NotificationType = 'success' | 'error';

type Notification = {
  id: number | string;
  message: string;
  type: NotificationType;
};

const notificationMessages: Record<string, Notification> = {
  login: {
    id: 0,
    message: 'Logged in successfully.',
    type: 'success',
  },
  logout: {
    id: 0,
    message: 'Logged out successfully.',
    type: 'success',
  },
  'customer-created': {
    id: 0,
    message: 'Customer account created successfully.',
    type: 'success',
  },
  'session-expired': {
    id: 0,
    message: 'Your session expired due to inactivity. Please log in again.',
    type: 'error',
  },
};

export function notify(message: string, type: NotificationType = 'success') {
  window.dispatchEvent(
    new CustomEvent('app-notification', {
      detail: { message, type },
    }),
  );
}

export default function NotificationCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastUrlNotification = useRef<string | null>(null);

  const notificationKey = searchParams.get('notification');

  const cleanUrl = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('notification');
    const query = nextParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    const addNotification = (
      message: string,
      type: NotificationType = 'success',
      notificationId: number | string = crypto.randomUUID(),
    ) => {
      const id = notificationId;
      setNotifications((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ]);
      window.setTimeout(() => {
        setNotifications((current) =>
          current.filter((notification) => notification.id !== id),
        );
      }, 4500);
    };

    const onNotification = (event: Event) => {
      const { message, type } = (event as CustomEvent<{
        message?: string;
        type?: NotificationType;
      }>).detail;

      if (message) {
        addNotification(message, type);
      }
    };

    window.addEventListener('app-notification', onNotification);
    return () => window.removeEventListener('app-notification', onNotification);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function showUnreadNotifications() {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          notifications?: Array<{
            id: string;
            message: string;
            type?: NotificationType;
          }>;
        };

        const unreadNotifications = data.notifications ?? [];
        if (cancelled || unreadNotifications.length === 0) {
          return;
        }

        unreadNotifications.forEach((notification) => {
          notify(notification.message, notification.type ?? 'success');
        });

        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: unreadNotifications.map((notification) => notification.id),
          }),
        });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }

    showUnreadNotifications();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!notificationKey || lastUrlNotification.current === notificationKey) {
      return;
    }

    const notification = notificationMessages[notificationKey];
    if (!notification) {
      return;
    }

    lastUrlNotification.current = notificationKey;
    notify(notification.message, notification.type);
    router.replace(cleanUrl, { scroll: false });
  }, [cleanUrl, notificationKey, router]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => {
        const isSuccess = notification.type === 'success';
        const Icon = isSuccess ? CheckCircleIcon : ExclamationCircleIcon;

        return (
          <div
            key={notification.id}
            className={`flex items-start gap-3 rounded-md border bg-white p-4 text-sm shadow-lg ${
              isSuccess
                ? 'border-green-200 text-green-800'
                : 'border-red-200 text-red-800'
            }`}
          >
            <Icon
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                isSuccess ? 'text-green-600' : 'text-red-600'
              }`}
            />
            <p className="min-w-0 flex-1 leading-5">{notification.message}</p>
            <button
              type="button"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Dismiss notification"
              onClick={() =>
                setNotifications((current) =>
                  current.filter((item) => item.id !== notification.id),
                )
              }
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
