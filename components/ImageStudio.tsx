'use client';

import { useState } from 'react';
import LayoutSelector from './LayoutSelector';
import LoadingScreen from './LoadingScreen';
import ImagePreview from './ImagePreview';
import { generateImage } from '@/lib/nanobanana';

type Layout = 'landscape' | 'mobile' | 'square';

export default function ImageStudio() {
  const [prompt, setPrompt] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<Layout>('square');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage(prompt, selectedLayout);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">
          Image Generation Studio
        </h1>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-black/10 p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-black font-medium mb-2">
              Image Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm rounded-lg border border-black/20 text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <LayoutSelector
            selectedLayout={selectedLayout}
            onSelect={setSelectedLayout}
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full mt-6 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {isLoading && <LoadingScreen />}

        {generatedImage && !isLoading && (
          <ImagePreview imageUrl={generatedImage} layout={selectedLayout} />
        )}
      </div>
    </div>
  );
}

