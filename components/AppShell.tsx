'use client';

import { useState } from 'react';
import ChatPanel from './ChatPanel';
import ImageStudio from './ImageStudio';

type Surface = 'studio' | 'chat';

function StatusButton({
  active,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'border border-studio-accent bg-studio-accent text-white'
          : 'border border-studio-border bg-transparent text-studio-muted hover:bg-studio-elevated hover:text-studio-text'
      }`}
      aria-pressed={active}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-white' : 'bg-studio-muted'}`} />
      <span className="truncate font-semibold">{label}</span>
      <span className="hidden truncate text-xs opacity-75 sm:inline">{meta}</span>
    </button>
  );
}

export default function AppShell() {
  const [surface, setSurface] = useState<Surface>('studio');

  return (
    <div className="relative h-dvh overflow-hidden bg-studio-bg text-studio-text">
      <main className="h-full pb-16">
        <div className={surface === 'studio' ? 'h-full' : 'hidden h-full'} aria-hidden={surface !== 'studio'}>
          <ImageStudio />
        </div>
        <div className={surface === 'chat' ? 'h-full' : 'hidden h-full'} aria-hidden={surface !== 'chat'}>
          <ChatPanel />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-studio-border bg-studio-surface/95 px-3 py-2 shadow-2xl backdrop-blur pb-safe-area">
        <div className="mx-auto flex max-w-3xl gap-2">
          <StatusButton
            active={surface === 'studio'}
            label="Image Studio"
            meta="Generate and export"
            onClick={() => setSurface('studio')}
          />
          <StatusButton
            active={surface === 'chat'}
            label="AI Chat"
            meta="Ideas, research, images"
            onClick={() => setSurface('chat')}
          />
        </div>
      </nav>
    </div>
  );
}
