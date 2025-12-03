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

  // For Qwen, don't show layout selector - dimensions follow input image
  if (!capabilities.supportsLayoutSelection) {
    return (
      <div className="mb-6">
        <label className="block text-black font-medium mb-3">
          Image Layout
        </label>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
          <span className="font-medium">Output dimensions:</span>{' '}
          {referenceDimensions
            ? `${referenceDimensions.width}x${referenceDimensions.height} (matches input image)`
            : 'Will match your reference image dimensions'}
        </div>
      </div>
    );
  }

  const layouts = getLayoutsForModel(selectedModel, hasReferenceImage);

  // Build display label with dimensions
  const getDisplayLabel = (layout: LayoutConfig): string => {
    if (layout.value === 'reference' && referenceDimensions) {
      return `${referenceDimensions.width}x${referenceDimensions.height}`;
    }
    return layout.dimensions;
  };

  return (
    <div className="mb-6">
      <label className="block text-black font-medium mb-3">
        Image Layout
      </label>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4">
        {layouts.map((layout) => (
          <button
            key={layout.value}
            onClick={() => onSelect(layout.value)}
            className={`sm:flex-1 px-3 py-3 rounded-lg border-2 transition-all ${
              selectedLayout === layout.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white/90 backdrop-blur-sm text-black border-black/20 hover:border-blue-300 active:bg-blue-50'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-1">{layout.icon}</div>
            <div className="text-xs sm:text-sm font-medium">{layout.label}</div>
            <div className="text-xs opacity-70">{getDisplayLabel(layout)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
