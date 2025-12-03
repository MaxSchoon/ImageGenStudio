'use client';

type Layout = 'landscape' | 'mobile' | 'square' | 'reference';
type Model = 'google' | 'grok' | 'huggingface' | 'qwen';

interface LayoutSelectorProps {
  selectedLayout: Layout;
  onSelect: (layout: Layout) => void;
  hasReferenceImage?: boolean;
  selectedModel?: Model;
}

export default function LayoutSelector({ selectedLayout, onSelect, hasReferenceImage = false, selectedModel = 'google' }: LayoutSelectorProps) {
  // Google doesn't support reference layout, only the three fixed layouts
  const modelSupportsReferenceLayout = selectedModel !== 'google';

  const layouts: { value: Layout; label: string; icon: string }[] = [
    { value: 'landscape', label: 'Landscape', icon: '▭' },
    { value: 'mobile', label: 'Mobile', icon: '▯' },
    { value: 'square', label: 'Square', icon: '▢' },
    ...(hasReferenceImage && modelSupportsReferenceLayout ? [{ value: 'reference' as Layout, label: 'Reference', icon: '📐' }] : []),
  ];

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
          </button>
        ))}
      </div>
    </div>
  );
}

