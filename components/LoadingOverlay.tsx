'use client';

import { useEffect, useMemo, useState } from 'react';

type LoadingMode = 'image' | 'storybook' | 'enhance';

interface LoadingOverlayProps {
  mode?: LoadingMode;
  label?: string;
  dimensions?: string;
  progressLabel?: string | null;
}

const IMAGE_STAGES = [
  {
    title: 'Reading the brief',
    detail: 'Scoring prompt signals, layout, model fit, and reference context.',
  },
  {
    title: 'Composing the frame',
    detail: 'Blocking the subject, whitespace, text zones, and visual hierarchy.',
  },
  {
    title: 'Rendering candidates',
    detail: 'Letting the model explore texture, lighting, color, and edge detail.',
  },
  {
    title: 'Checking export fit',
    detail: 'Holding the result until the preview is ready to inspect.',
  },
];

const STORYBOOK_STAGES = [
  {
    title: 'Mapping the story arc',
    detail: 'Balancing hook, problem, insight, proof, and CTA for the carousel.',
  },
  {
    title: 'Laying out the pages',
    detail: 'Keeping typography large, mobile-readable, and PDF-safe on every page.',
  },
  {
    title: 'Rendering the pages',
    detail: 'Building each page as a polished flattened storybook visual.',
  },
  {
    title: 'Checking PDF consistency',
    detail: 'Preparing the pages for a consistent document carousel sequence.',
  },
];

const ENHANCE_STAGES = [
  {
    title: 'Inspecting the source',
    detail: 'Finding subject edges, crop intent, color balance, and detail limits.',
  },
  {
    title: 'Planning the retouch',
    detail: 'Preserving identity while improving contrast, clarity, and finish.',
  },
  {
    title: 'Applying polish',
    detail: 'Refining exposure, background cleanup, texture, and sharpness.',
  },
  {
    title: 'Checking fidelity',
    detail: 'Making sure the enhancement still feels like the uploaded image.',
  },
];

function getLoadingStages(mode: LoadingMode) {
  if (mode === 'storybook') return STORYBOOK_STAGES;
  if (mode === 'enhance') return ENHANCE_STAGES;
  return IMAGE_STAGES;
}

function getProgress(elapsedMs: number) {
  const eased = 1 - Math.exp(-elapsedMs / 18000);
  return Math.min(92, Math.max(12, Math.round(eased * 100)));
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
  const score = Math.min(980, 120 + stageIndex * 180 + Math.floor(elapsedMs / 900) * 12);

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
        className="w-full max-w-[620px] rounded-xl border border-studio-border bg-studio-surface/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.28)] sm:p-5"
        role="status"
        aria-live="polite"
        aria-label={`${heading} in progress`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-studio-text/60">
              {label || 'Studio run'}{dimensions ? ` - ${dimensions}` : ''}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-studio-text">{heading}</h2>
            {progressLabel && (
              <p className="mt-1 text-xs font-medium text-studio-accent">{progressLabel}</p>
            )}
          </div>
          <div className="min-w-20 rounded-lg border border-studio-border bg-studio-bg px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-wider text-studio-text/60">Focus</div>
            <div className="text-sm font-semibold text-studio-accent">{score} pts</div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-5 gap-2" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((tile) => (
            <div
              key={tile}
              className="loading-tile relative aspect-[4/5] overflow-hidden rounded-lg border border-studio-border bg-studio-elevated"
              style={{ animationDelay: `${tile * 180}ms` }}
            >
              <div className="absolute inset-x-2 top-3 h-2 rounded-full bg-studio-border" />
              <div className="absolute inset-x-2 top-7 h-1 rounded-full bg-studio-border/70" />
              <div className="absolute inset-x-2 bottom-3 h-8 rounded-md bg-studio-bg/80" />
            </div>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-studio-text">{stage.title}</div>
            <div className="mt-1 max-w-[52ch] text-xs leading-relaxed text-studio-text/70">{stage.detail}</div>
          </div>
          <div className="text-sm font-semibold tabular-nums text-studio-text">{progress}%</div>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-studio-bg"
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

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stages.map((item, index) => {
            const isCurrent = index === stageIndex;
            const isDone = index < stageIndex;

            return (
              <div
                key={item.title}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  isCurrent
                    ? 'border-studio-accent bg-studio-accent/10 text-studio-text'
                    : isDone
                      ? 'border-studio-border bg-studio-elevated text-studio-text'
                      : 'border-studio-border bg-studio-bg text-studio-text/60'
                }`}
              >
                <div className="mb-1 font-semibold">{isDone ? 'Done' : `Step ${index + 1}`}</div>
                <div className="leading-snug">{item.title}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-studio-border bg-studio-bg px-3 py-2 text-xs leading-relaxed text-studio-text/70">
          Good generations often take a moment. The run keeps checking in while the model finishes.
        </div>
      </div>
    </div>
  );
}
