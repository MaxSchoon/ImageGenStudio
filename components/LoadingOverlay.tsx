'use client';

import { useEffect, useMemo, useState } from 'react';

type LoadingMode = 'image' | 'storybook' | 'enhance' | 'og-package';

interface LoadingOverlayProps {
  mode?: LoadingMode;
  label?: string;
  dimensions?: string;
  progressLabel?: string | null;
}

const IMAGE_STAGES = [
  'Reading the brief',
  'Composing the frame',
  'Rendering candidates',
  'Checking export fit',
];

const STORYBOOK_STAGES = [
  'Mapping the story arc',
  'Laying out the pages',
  'Rendering the pages',
  'Checking PDF consistency',
];

const ENHANCE_STAGES = [
  'Inspecting the source',
  'Planning the retouch',
  'Applying polish',
  'Checking fidelity',
];

const OG_PACKAGE_STAGES = [
  'Designing the master preview',
  'Rendering the master asset',
  'Exporting platform variants',
  'Building meta tags',
];

function getLoadingStages(mode: LoadingMode) {
  if (mode === 'storybook') return STORYBOOK_STAGES;
  if (mode === 'enhance') return ENHANCE_STAGES;
  if (mode === 'og-package') return OG_PACKAGE_STAGES;
  return IMAGE_STAGES;
}

function getProgress(elapsedMs: number) {
  const eased = 1 - Math.exp(-elapsedMs / 18000);
  return Math.min(92, Math.max(8, Math.round(eased * 100)));
}

export default function LoadingOverlay({
  mode = 'image',
  label,
  dimensions,
  progressLabel,
}: LoadingOverlayProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const stages = useMemo(() => getLoadingStages(mode), [mode]);
  const stageIndex = Math.min(stages.length - 1, Math.floor(elapsedMs / 5200));
  const stage = stages[stageIndex];
  const progress = getProgress(elapsedMs);

  useEffect(() => {
    setElapsedMs(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);

    return () => window.clearInterval(timer);
  }, [mode, label, dimensions]);

  const heading = mode === 'storybook'
    ? 'Building PDF Pages'
    : mode === 'enhance'
      ? 'Enhancing image'
      : 'Generating image';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-studio-bg/90 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-[380px] rounded-xl border border-studio-border bg-studio-surface/95 p-6 shadow-[0_14px_36px_rgba(0,0,0,0.28)]"
        role="status"
        aria-live="polite"
        aria-label={`${heading} in progress`}
      >
        <div className="flex items-center gap-2">
          <span className="loading-pulse h-2 w-2 rounded-full bg-studio-accent" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider text-studio-text/55">
            {label || 'Studio run'}{dimensions ? ` · ${dimensions}` : ''}
          </p>
        </div>

        <h2 className="mt-2 text-lg font-semibold text-studio-text">{heading}</h2>

        <div className="mt-6 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-studio-text/80">{stage}</span>
          <span className="text-sm font-semibold tabular-nums text-studio-text/55">{progress}%</span>
        </div>

        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-studio-bg"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="loading-progress h-full rounded-full bg-studio-accent"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {stages.map((title, index) => (
            <span
              key={title}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                index <= stageIndex ? 'bg-studio-accent' : 'bg-studio-border'
              }`}
            />
          ))}
        </div>

        {progressLabel && (
          <p className="mt-4 text-xs text-studio-text/50">{progressLabel}</p>
        )}
      </div>
    </div>
  );
}
