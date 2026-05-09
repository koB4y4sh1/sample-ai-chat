'use client';

import type { ReactNode } from 'react';

/** アプリ全体のクライアント境界（テーマ・i18n など将来の横断関心をここに集約）。 */
export function AppProviders({ children }: { children: ReactNode }) {
  return children;
}
