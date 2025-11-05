'use client';

type Layout = 'landscape' | 'mobile' | 'square' | 'reference';

interface LayoutSelectorProps {
  selectedLayout: Layout;
  onSelect: (layout: Layout) => void;
  hasReferenceImage?: boolean;
}

export default function LayoutSelector({ selectedLayout, onSelect, hasReferenceImage = false }: LayoutSelectorProps) {
  const layouts: { value: Layout; label: string; icon: string }[] = [
    { value: 'landscape', label: 'Landscape', icon: '▭' },
    { value: 'mobile', label: 'Mobile', icon: '▯' },
    { value: 'square', label: 'Square', icon: '▢' },
    ...(hasReferenceImage ? [{ value: 'reference' as Layout, label: 'Reference', icon: '📐' }] : []),
  ];

  return (
    <div className="mb-6">
      <label className="block text-black font-medium mb-3">
        Image Layout
      </label>
      <div className="flex gap-2 sm:gap-4 overflow-hidden">
        {layouts.map((layout) => (
          <button
            key={layout.value}
            onClick={() => onSelect(layout.value)}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-3 rounded-lg border-2 transition-all ${
              selectedLayout === layout.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white/90 backdrop-blur-sm text-black border-black/20 hover:border-blue-300'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-1">{layout.icon}</div>
            <div className="text-xs sm:text-sm font-medium truncate">{layout.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

