'use client';

import PromptInput from './PromptInput';
import ModelSelector from './ModelSelector';
import LayoutSelector from './LayoutSelector';
import ReferenceUpload from './ReferenceUpload';
import { Layout, Model } from '@/lib/modelConfig';

interface StudioControlsProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
  selectedLayout: Layout;
  onLayoutSelect: (layout: Layout) => void;
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

export default function StudioControls({
  prompt,
  onPromptChange,
  onEnhancePrompt,
  isEnhancing,
  selectedModel,
  onModelSelect,
  selectedLayout,
  onLayoutSelect,
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
  return (
    <div className="space-y-5">
      <PromptInput
        value={prompt}
        onChange={onPromptChange}
        onEnhance={onEnhancePrompt}
        isEnhancing={isEnhancing}
      />

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

      <ReferenceUpload
        uploadedImage={uploadedImage}
        onFileSelect={onFileSelect}
        onClear={onClearImage}
        isDragging={isDragging}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        isRequired={selectedModel === 'qwen'}
      />

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full py-3 bg-studio-accent text-white font-semibold rounded-lg hover:bg-studio-accent-hover active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate Image'}
      </button>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
