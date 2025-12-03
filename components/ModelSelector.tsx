'use client';

type Model = 'google' | 'grok' | 'huggingface' | 'qwen';

interface ModelSelectorProps {
  selectedModel: Model;
  onSelect: (model: Model) => void;
}

export default function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex justify-center items-center mb-8 px-2 sm:px-0">
      <div className="inline-flex flex-wrap justify-center gap-1 sm:gap-2 bg-gray-100/80 backdrop-blur-md rounded-full p-1 sm:p-1.5 border border-gray-200/50 shadow-lg max-w-full">
        <button
          onClick={() => onSelect('google')}
          className={`
            px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap
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
            px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap
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
            px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap
            ${
              selectedModel === 'huggingface'
                ? 'bg-white/90 backdrop-blur-sm text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          Flux
        </button>
        <button
          onClick={() => onSelect('qwen')}
          title="Qwen - Image-to-Image Generation"
          className={`
            px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 relative whitespace-nowrap
            ${
              selectedModel === 'qwen'
                ? 'bg-white/90 backdrop-blur-sm text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          Qwen
        </button>
      </div>
    </div>
  );
}

