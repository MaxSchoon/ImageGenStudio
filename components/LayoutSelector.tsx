'use client';

import { Layout, Model, MODEL_CAPABILITIES, getLayoutsForModel, LayoutConfig } from '@/lib/modelConfig';

interface LayoutSelectorProps {
  selectedLayout: Layout;
  onSelect: (layout: Layout) => void;
  hasReferenceImage?: boolean;
  selectedModel?: Model;
  referenceDimensions?: { width: number; height: number } | null;
}

export default function LayoutSelector({
  selectedLayout,
  onSelect,
  hasReferenceImage = false,
  selectedModel = 'google',
  referenceDimensions
}: LayoutSelectorProps) {
  const capabilities = MODEL_CAPABILITIES[selectedModel];

  if (!capabilities.supportsLayoutSelection) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-studio-text">Layout</label>
        <div className="p-3 bg-studio-elevated rounded-lg border border-studio-border text-sm text-studio-muted">
          <span className="font-medium text-studio-text">Output dimensions:</span>{' '}
          {referenceDimensions
            ? `${referenceDimensions.width}x${referenceDimensions.height} (matches input)`
            : 'Will match your reference image'}
        </div>
      </div>
    );
  }

  const layouts = getLayoutsForModel(selectedModel, hasReferenceImage);

  const getDisplayLabel = (layout: LayoutConfig): string => {
    if (layout.value === 'reference' && referenceDimensions) {
      return `${referenceDimensions.width}x${referenceDimensions.height}`;
    }
    return layout.dimensions;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-studio-text">Layout</label>
      <div className="grid grid-cols-2 gap-2">
        {layouts.map((layout) => (
          <button
            key={layout.value}
            onClick={() => onSelect(layout.value)}
            className={`px-3 py-2.5 rounded-lg border transition-colors text-center ${
              selectedLayout === layout.value
                ? 'bg-studio-accent/10 text-studio-accent border-studio-accent'
                : 'bg-studio-elevated text-studio-muted border-studio-border hover:border-studio-muted'
            }`}
          >
            <div className="text-lg mb-0.5">{layout.icon}</div>
            <div className="text-xs font-medium">{layout.label}</div>
            <div className="text-[10px] opacity-70">{getDisplayLabel(layout)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
