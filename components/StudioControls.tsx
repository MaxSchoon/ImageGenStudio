'use client';

import PromptInput from './PromptInput';
import ModelSelector from './ModelSelector';
import LayoutSelector from './LayoutSelector';
import ReferenceUpload from './ReferenceUpload';
import CreatorWorkflowPanel from './CreatorWorkflowPanel';
import { CreatorPreset } from '@/lib/creatorContent';
import { Layout, Model, MODEL_CAPABILITIES } from '@/lib/modelConfig';

interface StudioControlsProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
  selectedLayout: Layout;
  onLayoutSelect: (layout: Layout) => void;
  selectedCreatorPreset: CreatorPreset | null;
  onCreatorPresetSelect: (preset: CreatorPreset | null) => void;
  uploadedImage: string | null;
  onFileSelect: (file: File) => void;
  onClearImage: () => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  referenceDimensions: { width: number; height: number } | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-studio-text">{title}</h2>
      {description && <p className="mt-1 text-xs leading-relaxed text-studio-muted">{description}</p>}
    </div>
  );
}

function LockedOutput({ preset }: { preset: CreatorPreset }) {
  return (
    <div className="rounded-lg border border-studio-border bg-studio-elevated p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-studio-text">Output locked by workflow</div>
          <p className="mt-1 text-xs leading-relaxed text-studio-muted">
            Manual layout is hidden because this preset exports to {preset.dimensions}.
          </p>
        </div>
        <div className="shrink-0 rounded-md bg-studio-bg px-2 py-1 text-xs font-medium text-studio-text">
          {preset.shortLabel}
        </div>
      </div>
    </div>
  );
}

export default function StudioControls({
  prompt,
  onPromptChange,
  onEnhancePrompt,
  isEnhancing,
  selectedModel,
  onModelSelect,
  selectedLayout,
  onLayoutSelect,
  selectedCreatorPreset,
  onCreatorPresetSelect,
  uploadedImage,
  onFileSelect,
  onClearImage,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  referenceDimensions,
  isLoading,
  error,
  onGenerate,
}: StudioControlsProps) {
  const capabilities = MODEL_CAPABILITIES[selectedModel];
  const imageRequired = capabilities.requiresReferenceImage || selectedCreatorPreset?.workflow === 'enhance';
  const showInlineReferenceUpload = imageRequired || !!uploadedImage;
  const referenceDescription = imageRequired
    ? 'Required for this workflow before generation.'
    : 'Optional. Use a reference when you want the model to preserve composition or subject details.';

  return (
    <div className="space-y-5">
      <CreatorWorkflowPanel
        selectedPreset={selectedCreatorPreset}
        onPresetSelect={onCreatorPresetSelect}
        onApplyPrompt={onPromptChange}
        hasUploadedImage={!!uploadedImage}
      />

      <section>
        <PromptInput
          value={prompt}
          onChange={onPromptChange}
          onEnhance={onEnhancePrompt}
          isEnhancing={isEnhancing}
          label={selectedCreatorPreset ? 'Creative brief' : 'Prompt'}
          description={selectedCreatorPreset ? 'Write the asset brief, or use the assistant in the workflow panel.' : undefined}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Output"
          description={selectedCreatorPreset ? 'The workflow decides the export size. Change the workflow above to change dimensions.' : 'Choose the model and shape for freeform generation.'}
        />

        {selectedCreatorPreset ? (
          <>
            <LockedOutput preset={selectedCreatorPreset} />
            <details className="rounded-lg border border-studio-border bg-studio-elevated">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-studio-text">
                Advanced model settings
              </summary>
              <div className="space-y-3 border-t border-studio-border p-3">
                <ModelSelector
                  selectedModel={selectedModel}
                  onSelect={onModelSelect}
                />
                <p className="text-xs leading-relaxed text-studio-muted">
                  Presets keep the final export dimensions fixed. Use freeform mode when you need manual layout control.
                </p>
              </div>
            </details>
          </>
        ) : (
          <>
            <ModelSelector
              selectedModel={selectedModel}
              onSelect={onModelSelect}
            />
            <LayoutSelector
              selectedLayout={selectedLayout}
              onSelect={onLayoutSelect}
              hasReferenceImage={!!uploadedImage}
              selectedModel={selectedModel}
              referenceDimensions={referenceDimensions}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        {showInlineReferenceUpload ? (
          <>
            <SectionHeader title="Reference image" description={referenceDescription} />
            <ReferenceUpload
              uploadedImage={uploadedImage}
              onFileSelect={onFileSelect}
              onClear={onClearImage}
              isDragging={isDragging}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isRequired={imageRequired}
            />
          </>
        ) : capabilities.supportsReferenceImages ? (
          <details className="rounded-lg border border-studio-border bg-studio-elevated">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-studio-text">
              Add reference image
            </summary>
            <div className="space-y-3 border-t border-studio-border p-3">
              <p className="text-xs leading-relaxed text-studio-muted">{referenceDescription}</p>
              <ReferenceUpload
                uploadedImage={uploadedImage}
                onFileSelect={onFileSelect}
                onClear={onClearImage}
                isDragging={isDragging}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                isRequired={false}
              />
            </div>
          </details>
        ) : null}
      </section>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full rounded-lg bg-studio-accent py-3 font-semibold text-white transition-colors hover:bg-studio-accent-hover active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : selectedCreatorPreset ? `Generate ${selectedCreatorPreset.shortLabel}` : 'Generate image'}
      </button>
    </div>
  );
}
