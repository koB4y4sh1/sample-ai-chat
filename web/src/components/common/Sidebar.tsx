'use client';

import { Moon, PanelLeft, PanelLeftClose, Plus, Sun, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { cn } from '@/lib/utils';

/** サイドバーに並べるセッション（チャット以外からも同じ形で渡せる）。 */
export type SidebarSessionItem = {
  id: string;
  title: string;
};

interface SidebarProps {
  sessions: SidebarSessionItem[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  theme,
  toggleTheme,
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const pathname = usePathname() ?? '';

  return (
    <>
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: isOpen ? 260 : 0 }}
        className={cn(
          'relative h-full flex flex-col border-r transition-colors duration-500 overflow-hidden',
          'bg-sidebar-bg border-border',
        )}
      >
        <div className="flex flex-col h-full min-w-[260px]">
          <div className="p-6 pb-8 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent-gradient" />
            <span className="text-sm font-bold tracking-widest uppercase text-text-primary">
              Copilot Core
            </span>
          </div>

          <div className="px-4 mb-3 flex flex-col gap-1 text-xs font-medium text-text-secondary">
            <Link
              href="/"
              className={cn(
                'rounded-lg px-3 py-2 transition-colors hover:bg-bg hover:text-text-primary',
                pathname === '/' ? 'bg-bg text-text-primary' : '',
              )}
            >
              Chat
            </Link>
          </div>

          <div className="px-4 mb-4">
            <button
              type="button"
              onClick={onNewChat}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all w-full justify-start group border border-border',
                'bg-sidebar-bg hover:bg-bg text-text-primary shadow-xs',
              )}
            >
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-1">
            <AnimatePresence initial={false}>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all',
                    currentSessionId === session.id
                      ? 'bg-[#F0F0EE] dark:bg-slate-800 text-text-primary font-medium'
                      : 'text-text-secondary hover:bg-bg',
                  )}
                >
                  <span className="flex-1 text-[13px] truncate">{session.title}</span>
                  <button
                    type="button"
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-auto p-4 border-t border-border space-y-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full p-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <div className="w-4.5 h-4.5 rounded-full border-1.5 border-current flex items-center justify-center shrink-0">
                {theme === 'dark' ? (
                  <Sun className="w-2.5 h-2.5" />
                ) : (
                  <Moon className="w-2.5 h-2.5" />
                )}
              </div>
              <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 w-full p-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <div className="w-4.5 h-4.5 rounded-full border-1.5 border-current shrink-0" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </motion.aside>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'absolute top-4 left-4 z-50 p-2 rounded-lg transition-all border',
          isOpen ? 'left-[220px] opacity-0 pointer-events-none' : 'left-4 opacity-100',
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900',
        )}
      >
        {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </button>
    </>
  );
}
