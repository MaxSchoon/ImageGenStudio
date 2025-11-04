'use client';

import { useState } from 'react';
import LayoutSelector from './LayoutSelector';
import LoadingScreen from './LoadingScreen';
import ImagePreview from './ImagePreview';
import ModelSelector from './ModelSelector';
import { generateImage } from '@/lib/nanobanana';

type Layout = 'landscape' | 'mobile' | 'square';
type Model = 'google' | 'grok';

export default function ImageStudio() {
  const [prompt, setPrompt] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<Layout>('square');
  const [selectedModel, setSelectedModel] = useState<Model>('google');
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
      const imageUrl = await generateImage(prompt, selectedLayout, selectedModel);
      console.log('ImageStudio received imageUrl:', {
        hasImageUrl: !!imageUrl,
        imageUrlLength: imageUrl?.length || 0,
        imageUrlPreview: imageUrl?.substring(0, 50) || 'N/A'
      });
      setGeneratedImage(imageUrl);
      console.log('ImageStudio set generatedImage state');
    } catch (err) {
      console.error('ImageStudio error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">
          Image Generation Studio
        </h1>

        <ModelSelector
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image Prompt and Layout */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-black/10 p-8">
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

          {/* Right Column: Generated Image */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {isLoading && <LoadingScreen />}

            {generatedImage && !isLoading && (
              <ImagePreview imageUrl={generatedImage} layout={selectedLayout} />
            )}

            {!generatedImage && !isLoading && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-black/10 p-8">
                <h2 className="text-2xl font-bold text-black mb-6">Generated Image</h2>
                <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border border-black/10">
                  <p className="text-black/40">Your generated image will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

