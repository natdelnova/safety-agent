import './global.css';
import type { Viewport } from 'next';

export const metadata = {
  title: 'SafetyCall - Stay Safe',
  description: 'Schedule safety check-in calls with your trusted contacts',
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
