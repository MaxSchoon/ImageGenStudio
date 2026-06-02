'use client';

import { Model, OPENROUTER_IMAGE_MODELS } from '@/lib/modelConfig';

interface ModelSelectorProps {
  selectedModel: Model;
  onSelect: (model: Model) => void;
  disabledModels?: Partial<Record<Model, string>>;
}

export default function ModelSelector({ selectedModel, onSelect, disabledModels = {} }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-studio-text">Model</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPENROUTER_IMAGE_MODELS.map((model) => (
          <button
            key={model.value}
            type="button"
            onClick={() => onSelect(model.value)}
            disabled={!!disabledModels[model.value]}
            title={disabledModels[model.value]}
            className={`min-h-[72px] px-3 py-2.5 rounded-lg border text-left transition-colors ${
              selectedModel === model.value
                ? 'bg-studio-accent/10 text-studio-accent border-studio-accent'
                : disabledModels[model.value]
                  ? 'cursor-not-allowed border-studio-border bg-studio-elevated text-studio-muted/40'
                  : 'bg-studio-elevated text-studio-muted border-studio-border hover:border-studio-muted hover:text-studio-text'
            }`}
          >
            <span className="block text-sm font-semibold leading-tight">{model.shortLabel}</span>
            <span className="mt-1 block text-[10px] leading-snug opacity-75">{model.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
