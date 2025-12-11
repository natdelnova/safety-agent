import './global.css';
import type { Viewport, Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pronto',
  description: 'Quick errands and reminders',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
