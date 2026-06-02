'use client';

import { useState } from 'react';
import { CREATOR_PRESETS, CreatorPreset } from '@/lib/creatorContent';

interface CreatorWorkflowPanelProps {
  selectedPresetId: string | null;
  onPresetSelect: (preset: CreatorPreset | null) => void;
  onApplyPrompt: (prompt: string) => void;
  hasUploadedImage: boolean;
}

interface AssistantResult {
  summary?: string;
  imagePrompt?: string;
  postCopy?: string;
  storybook?: Array<{
    title: string;
    visualDirection: string;
    copy: string;
  }>;
  productionNotes?: string[];
}

export default function CreatorWorkflowPanel({
  selectedPresetId,
  onPresetSelect,
  onApplyPrompt,
  hasUploadedImage,
}: CreatorWorkflowPanelProps) {
  const [brief, setBrief] = useState('');
  const [assistantResult, setAssistantResult] = useState<AssistantResult | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = CREATOR_PRESETS.find((preset) => preset.id === selectedPresetId) || null;

  const handleAskAssistant = async () => {
    if (!brief.trim() || isAsking) return;

    setIsAsking(true);
    setError(null);
    try {
      const response = await fetch('/api/creator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: brief,
          preset: selectedPreset
            ? {
                id: selectedPreset.id,
                label: selectedPreset.label,
                dimensions: selectedPreset.dimensions,
                workflow: selectedPreset.workflow,
              }
            : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate creator direction.');
      }
      setAssistantResult(data.result);
      if (data.result?.imagePrompt) {
        onApplyPrompt(data.result.imagePrompt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate creator direction.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-studio-text">Creator workflow</label>
        <p className="mt-1 text-xs text-studio-muted">
          LinkedIn-first formats, safe areas, and sales story structures.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => onPresetSelect(null)}
          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
            !selectedPreset
              ? 'border-studio-accent bg-studio-accent/10 text-studio-accent'
              : 'border-studio-border bg-studio-elevated text-studio-muted hover:border-studio-muted'
          }`}
        >
          <div className="text-xs font-semibold">Freeform image</div>
          <div className="text-[10px] opacity-75">Use the manual layout controls</div>
        </button>

        {CREATOR_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.id}
            onClick={() => onPresetSelect(preset)}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${
              selectedPresetId === preset.id
                ? 'border-studio-accent bg-studio-accent/10 text-studio-accent'
                : 'border-studio-border bg-studio-elevated text-studio-muted hover:border-studio-muted'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-current">{preset.shortLabel}</span>
              <span className="text-[10px] opacity-75">{preset.dimensions}</span>
            </div>
            <div className="mt-1 text-[10px] leading-snug opacity-75">{preset.guidance}</div>
          </button>
        ))}
      </div>

      {selectedPreset?.workflow === 'enhance' && !hasUploadedImage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          Upload an image first to use enhancement mode.
        </div>
      )}

      {selectedPreset?.safeArea && (
        <div className="rounded-lg border border-studio-border bg-studio-elevated p-3">
          <div className="text-xs font-semibold text-studio-text">{selectedPreset.safeArea.label}</div>
          <div className="mt-1 text-[10px] leading-relaxed text-studio-muted">{selectedPreset.safeArea.description}</div>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-studio-border bg-studio-elevated p-3">
        <label className="block text-xs font-semibold text-studio-text">Creator assistant</label>
        <textarea
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          placeholder="Brief the creator, target audience, offer, proof, tone, and desired CTA..."
          rows={4}
          className="w-full resize-none rounded-md border border-studio-border bg-studio-bg px-3 py-2 text-sm text-studio-text placeholder:text-studio-muted/60 focus:border-studio-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAskAssistant}
          disabled={isAsking || !brief.trim()}
          className="w-full rounded-lg bg-studio-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-studio-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAsking ? 'Building workflow...' : 'Build LinkedIn workflow'}
        </button>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>

      {assistantResult && (
        <div className="space-y-3 rounded-lg border border-studio-border bg-studio-surface p-3">
          {assistantResult.summary && (
            <p className="text-xs leading-relaxed text-studio-text">{assistantResult.summary}</p>
          )}

          {assistantResult.imagePrompt && (
            <button
              type="button"
              onClick={() => onApplyPrompt(assistantResult.imagePrompt || '')}
              className="w-full rounded-md border border-studio-border bg-studio-elevated px-3 py-2 text-left text-xs text-studio-text hover:border-studio-muted"
            >
              Apply image prompt
            </button>
          )}

          {assistantResult.postCopy && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-studio-muted">Post copy</div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-studio-muted">{assistantResult.postCopy}</p>
            </div>
          )}

          {assistantResult.storybook?.length ? (
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-studio-muted">5-page storybook</div>
              <div className="space-y-2">
                {assistantResult.storybook.map((page, index) => (
                  <div key={`${page.title}-${index}`} className="rounded-md bg-studio-elevated p-2">
                    <div className="text-xs font-semibold text-studio-text">{index + 1}. {page.title}</div>
                    <div className="mt-1 text-[10px] leading-relaxed text-studio-muted">{page.visualDirection}</div>
                    <div className="mt-1 text-[10px] leading-relaxed text-studio-muted/80">{page.copy}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {assistantResult.productionNotes?.length ? (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-studio-muted">Production notes</div>
              <ul className="space-y-1 text-[10px] leading-relaxed text-studio-muted">
                {assistantResult.productionNotes.map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
