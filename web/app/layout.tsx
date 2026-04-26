import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@copilotkit/react-core/v2/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zenith AI Chat',
  description: 'Next.js frontend and BFF for Zenith AI Chat.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
