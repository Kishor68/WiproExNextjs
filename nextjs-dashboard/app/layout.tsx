import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Suspense } from 'react';
import ServiceWorkerRegistration from '@/app/ui/service-worker-registration';
import NotificationCenter from '@/app/ui/notification-center';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.webmanifest',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="WiproEx" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Suspense fallback={null}>
          <NotificationCenter />
        </Suspense>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
