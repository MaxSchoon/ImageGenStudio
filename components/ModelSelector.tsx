'use client';

type Model = 'google' | 'grok' | 'huggingface';

interface ModelSelectorProps {
  selectedModel: Model;
  onSelect: (model: Model) => void;
}

export default function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex justify-center items-center gap-2 mb-8">
      <div className="inline-flex bg-gray-100/80 backdrop-blur-md rounded-full p-1.5 border border-gray-200/50 shadow-lg">
        <button
          onClick={() => onSelect('google')}
          className={`
            px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300
            ${
              selectedModel === 'google'
                ? 'bg-white/90 backdrop-blur-sm text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          Google
        </button>
        <button
          onClick={() => onSelect('grok')}
          className={`
            px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300
            ${
              selectedModel === 'grok'
                ? 'bg-white/90 backdrop-blur-sm text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          Grok
        </button>
        <button
          onClick={() => onSelect('huggingface')}
          className={`
            px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300
            ${
              selectedModel === 'huggingface'
                ? 'bg-white/90 backdrop-blur-sm text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          FLUX.1-Kontext
        </button>
      </div>
    </div>
  );
}

