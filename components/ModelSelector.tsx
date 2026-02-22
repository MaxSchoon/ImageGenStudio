'use client';

type Model = 'google' | 'grok' | 'huggingface' | 'qwen';

interface ModelSelectorProps {
  selectedModel: Model;
  onSelect: (model: Model) => void;
}

const MODELS: { value: Model; label: string }[] = [
  { value: 'google', label: 'Google' },
  { value: 'grok', label: 'Grok' },
  { value: 'huggingface', label: 'Flux' },
  { value: 'qwen', label: 'Qwen' },
];

export default function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-studio-text">Model</label>
      <div className="grid grid-cols-4 gap-1 bg-studio-bg rounded-lg p-1">
        {MODELS.map((model) => (
          <button
            key={model.value}
            onClick={() => onSelect(model.value)}
            className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              selectedModel === model.value
                ? 'bg-studio-accent text-white'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-elevated'
            }`}
          >
            {model.label}
          </button>
        ))}
      </div>
    </div>
  );
}
