'use client';

import { useState } from 'react';
import { CREATOR_PRESETS, CreatorPlatform, CreatorPreset } from '@/lib/creatorContent';

interface CreatorWorkflowPanelProps {
  selectedPreset: CreatorPreset | null;
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
  metaTags?: string[];
}

const PLATFORM_PRESETS: Record<Exclude<CreatorPlatform, never>, CreatorPreset[]> = {
  linkedin: CREATOR_PRESETS.filter((preset) => preset.platform === 'linkedin'),
  website: CREATOR_PRESETS.filter((preset) => preset.platform === 'website'),
};

const DEFAULT_PLATFORM_PRESET: Record<CreatorPlatform, CreatorPreset> = {
  linkedin: PLATFORM_PRESETS.linkedin[0],
  website: PLATFORM_PRESETS.website.find((preset) => preset.id === 'website-og-package') || PLATFORM_PRESETS.website[0],
};

export default function CreatorWorkflowPanel({
  selectedPreset,
  onPresetSelect,
  onApplyPrompt,
  hasUploadedImage,
}: CreatorWorkflowPanelProps) {
  const [brief, setBrief] = useState('');
  const [assistantResult, setAssistantResult] = useState<AssistantResult | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlatform: CreatorPlatform | null = selectedPreset?.platform || null;
  const selectedPresetId = selectedPreset?.id || null;
  const platformPresets = activePlatform ? PLATFORM_PRESETS[activePlatform] : [];

  const handlePlatformSelect = (platform: CreatorPlatform | null) => {
    if (!platform) {
      onPresetSelect(null);
      return;
    }
    onPresetSelect(DEFAULT_PLATFORM_PRESET[platform]);
  };

  const handleAskAssistant = async () => {
    if (!brief.trim() || isAsking) return;

    setIsAsking(true);
    setError(null);
    try {
      const endpoint = activePlatform === 'website' ? '/api/og-chat' : '/api/creator-chat';
      const response = await fetch(endpoint, {
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
        throw new Error(data.error || 'Failed to generate workflow direction.');
      }
      setAssistantResult(data.result);
      if (data.result?.imagePrompt) {
        onApplyPrompt(data.result.imagePrompt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow direction.');
    } finally {
      setIsAsking(false);
    }
  };

  const assistantLabel = activePlatform === 'website' ? 'Build website preview workflow' : 'Build LinkedIn workflow';

  return (
    <section className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-studio-text">Workflow</label>
        <p className="mt-1 text-xs leading-relaxed text-studio-muted">
          Start freeform, or lock the output to a LinkedIn or website social preview format.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-studio-bg p-1">
        <button
          type="button"
          onClick={() => handlePlatformSelect(null)}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            !selectedPreset
              ? 'bg-studio-accent text-white'
              : 'text-studio-muted hover:bg-studio-elevated hover:text-studio-text'
          }`}
        >
          Freeform
        </button>
        <button
          type="button"
          onClick={() => handlePlatformSelect('linkedin')}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activePlatform === 'linkedin'
              ? 'bg-studio-accent text-white'
              : 'text-studio-muted hover:bg-studio-elevated hover:text-studio-text'
          }`}
        >
          LinkedIn
        </button>
        <button
          type="button"
          onClick={() => handlePlatformSelect('website')}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activePlatform === 'website'
              ? 'bg-studio-accent text-white'
              : 'text-studio-muted hover:bg-studio-elevated hover:text-studio-text'
          }`}
        >
          Website
        </button>
      </div>

      {selectedPreset && (
        <div className="space-y-3 rounded-lg border border-studio-border bg-studio-elevated p-3">
          <div className="grid grid-cols-2 gap-2">
            {platformPresets.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => onPresetSelect(preset)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  selectedPresetId === preset.id
                    ? 'border-studio-accent bg-studio-accent/10 text-studio-accent'
                    : 'border-studio-border bg-studio-bg text-studio-muted hover:border-studio-muted hover:text-studio-text'
                }`}
              >
                <div className="text-xs font-semibold text-current">{preset.shortLabel}</div>
                <div className="mt-0.5 text-[10px] opacity-75">{preset.dimensions}</div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-studio-border bg-studio-bg p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-studio-text">{selectedPreset.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-studio-muted">{selectedPreset.guidance}</div>
              </div>
              <div className="shrink-0 rounded-md bg-studio-surface px-2 py-1 text-xs font-medium text-studio-text">
                {selectedPreset.dimensions}
              </div>
            </div>

            {selectedPreset.safeArea && (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs leading-relaxed text-amber-200">
                <span className="font-semibold">{selectedPreset.safeArea.label}:</span>{' '}
                {selectedPreset.safeArea.description}
              </div>
            )}

            {selectedPreset.workflow === 'enhance' && !hasUploadedImage && (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs leading-relaxed text-amber-200">
                Upload an image below before generating an enhanced LinkedIn asset.
              </div>
            )}
          </div>

          <details className="rounded-lg border border-studio-border bg-studio-bg">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-studio-text">
              {activePlatform === 'website' ? 'Website preview assistant' : 'Creator assistant'}
            </summary>
            <div className="space-y-3 border-t border-studio-border p-3">
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder={
                  activePlatform === 'website'
                    ? 'Brief the page title, value prop, audience, brand colors, and the social platforms you need to support...'
                    : 'Brief the creator, target audience, offer, proof, tone, and desired CTA...'
                }
                rows={4}
                className="w-full resize-none rounded-md border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-text placeholder:text-studio-muted focus:border-studio-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAskAssistant}
                disabled={isAsking || !brief.trim()}
                className="w-full rounded-lg bg-studio-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-studio-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAsking ? 'Building workflow...' : assistantLabel}
              </button>
              {error && <div className="text-xs text-red-400">{error}</div>}

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
                      <div className="mb-1 text-xs font-semibold text-studio-text">Post copy</div>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-studio-muted">{assistantResult.postCopy}</p>
                    </div>
                  )}

                  {assistantResult.metaTags?.length ? (
                    <div>
                      <div className="mb-1 text-xs font-semibold text-studio-text">Meta tag notes</div>
                      <ul className="space-y-1 text-[10px] leading-relaxed text-studio-muted">
                        {assistantResult.metaTags.map((note, index) => (
                          <li key={`${note}-${index}`}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {assistantResult.storybook?.length ? (
                    <div>
                      <div className="mb-2 text-xs font-semibold text-studio-text">5-page storybook</div>
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
                      <div className="mb-1 text-xs font-semibold text-studio-text">Production notes</div>
                      <ul className="space-y-1 text-[10px] leading-relaxed text-studio-muted">
                        {assistantResult.productionNotes.map((note, index) => (
                          <li key={`${note}-${index}`}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}