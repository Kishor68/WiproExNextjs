import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import ServiceWorkerRegistration from '@/app/ui/service-worker-registration';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
  icons: {
    icon: '/favicon.ico',
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}