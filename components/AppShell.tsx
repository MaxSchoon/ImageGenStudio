'use client';

import { useState } from 'react';
import ChatPanel from './ChatPanel';
import ImageStudio from './ImageStudio';

type Surface = 'studio' | 'chat';

function StatusButton({
  active,
  label,
  meta,
  withDivider,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  withDivider?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 px-3 text-sm transition-colors ${
        withDivider ? 'border-l border-studio-border' : ''
      } ${
        active
          ? 'bg-studio-elevated text-studio-accent'
          : 'text-studio-muted hover:bg-studio-elevated/40 hover:text-studio-text'
      }`}
      aria-pressed={active}
    >
      {active && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-studio-accent" />}
      <span className="truncate font-semibold">{label}</span>
      <span className="hidden truncate text-xs font-normal text-studio-muted sm:inline">{meta}</span>
    </button>
  );
}

export default function AppShell() {
  const [surface, setSurface] = useState<Surface>('studio');

  return (
    <div className="relative h-dvh overflow-hidden bg-studio-bg text-studio-text">
      <main className="h-full pb-status-bar">
        <div className={surface === 'studio' ? 'h-full' : 'hidden h-full'} aria-hidden={surface !== 'studio'}>
          <ImageStudio />
        </div>
        <div className={surface === 'chat' ? 'h-full' : 'hidden h-full'} aria-hidden={surface !== 'chat'}>
          <ChatPanel />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-studio-border bg-studio-surface/95 backdrop-blur pb-safe-area">
        <div className="mx-auto flex h-status-bar max-w-3xl overflow-hidden">
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
            withDivider
            onClick={() => setSurface('chat')}
          />
        </div>
      </nav>
    </div>
  );
}
