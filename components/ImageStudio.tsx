'use client';

import { useState, useRef } from 'react';
import LayoutSelector from './LayoutSelector';
import LoadingScreen from './LoadingScreen';
import ImagePreview from './ImagePreview';
import ModelSelector from './ModelSelector';
import AutocompleteTextarea from './AutocompleteTextarea';
import { generateImage } from '@/lib/nanobanana';

type Layout = 'landscape' | 'mobile' | 'square' | 'reference';
type Model = 'google' | 'grok' | 'huggingface' | 'qwen';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageStudio() {
  const [prompt, setPrompt] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<Layout>('square');
  const [selectedModel, setSelectedModel] = useState<Model>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceImageDimensions, setReferenceImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload a JPEG, PNG, or WebP image.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setUploadedImage(result);
        // Extract dimensions from the image
        const img = new Image();
        img.onload = () => {
          setReferenceImageDimensions({ width: img.width, height: img.height });
          // Only auto-select 'reference' layout if the model supports it (Google doesn't)
          if (selectedModel !== 'google') {
            setSelectedLayout('reference');
          }
        };
        img.onerror = () => {
          setError('Failed to load image dimensions.');
        };
        img.src = result;
      }
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setReferenceImageDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
    // If reference layout was selected, reset to square
    if (selectedLayout === 'reference') {
      setSelectedLayout('square');
    }
  };

  const handleModelSelect = (model: Model) => {
    const previousModel = selectedModel;
    const modelsSupportingReferenceImages: Model[] = ['google', 'huggingface', 'qwen'];
    const previousModelSupportsImages = modelsSupportingReferenceImages.includes(previousModel);
    const newModelSupportsImages = modelsSupportingReferenceImages.includes(model);

    setSelectedModel(model);

    // If switching to Google and 'reference' layout is selected, change to 'square'
    // Google doesn't support reference layout, only landscape, mobile, and square
    if (model === 'google' && selectedLayout === 'reference') {
      setSelectedLayout('square');
      setError('Reference layout is not supported with Google. Switched to square layout.');
    }
    // Handle Grok: show message when switching TO Grok, but preserve the image data
    else if (model === 'grok' && uploadedImage && previousModelSupportsImages) {
      setError('Reference images are not supported with Grok. Your image will be preserved when you switch to another model.');
    }
    // Clear error when switching FROM Grok to a model that supports images
    else if (previousModel === 'grok' && newModelSupportsImages) {
      setError(null);
    }
    // Clear error when switching between models that support images
    else if (previousModelSupportsImages && newModelSupportsImages) {
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }


    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Don't pass uploadedImage to Grok API as it doesn't support reference images
      // FLUX.1-Kontext and Qwen support reference images, so pass it for those models
      const imageDataToSend = selectedModel === 'grok' 
        ? undefined 
        : (uploadedImage || undefined);
      
      // For reference layout, pass dimensions if available
      const layoutToUse = selectedLayout === 'reference' && referenceImageDimensions 
        ? { type: 'reference' as const, width: referenceImageDimensions.width, height: referenceImageDimensions.height }
        : selectedLayout;
      
      const imageUrl = await generateImage(prompt, layoutToUse, selectedModel, imageDataToSend);
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
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">
          Image Generation Studio
        </h1>
        <p className="text-center italic text-black/70 mb-8">
          "It is the glory of God to conceal things, but the glory of kings is to search things out."—Proverbs 25:2 (ESV)
        </p>

        <ModelSelector
          selectedModel={selectedModel}
          onSelect={handleModelSelect}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Column: Image Prompt and Layout */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-black/10 p-4 sm:p-8 overflow-hidden">
            <div className="mb-6">
              <label htmlFor="prompt" className="block text-black font-medium mb-2">
                Image Prompt
                <span className="hidden sm:inline text-xs text-gray-500 ml-2 font-normal">
                  (Tab to accept suggestions)
                </span>
              </label>
              <AutocompleteTextarea
                id="prompt"
                value={prompt}
                onChange={setPrompt}
                placeholder="Describe the image you want to generate..."
                className=""
                rows={4}
              />
            </div>

            <div className="mb-6">
              <label className="block text-black font-medium mb-2">
                Reference Image {selectedModel === 'qwen' ? '(Required)' : '(Optional)'}
                {selectedModel === 'grok' && (
                  <span className="text-xs text-amber-600 ml-2 font-normal">
                    (Not supported by Grok)
                  </span>
                )}
              </label>
              {selectedModel === 'grok' ? (
                <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50 border-gray-300">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-2 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 mb-1">
                    Reference images not supported with Grok
                  </p>
                  <p className="text-xs text-gray-500">
                    Switch to Google, FLUX.1-Kontext, or Qwen to use reference images
                  </p>
                </div>
              ) : !uploadedImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-black/20 hover:border-black/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-black/40 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-black/60 mb-1">
                      Drag and drop an image here, or click to select
                    </p>
                    <p className="text-xs text-black/40">
                      JPEG, PNG, or WebP (max 10MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative rounded-lg overflow-hidden border border-black/20">
                    <img
                      src={uploadedImage}
                      alt="Uploaded reference"
                      className="w-full h-auto max-h-40 sm:max-h-64 object-contain"
                    />
                  </div>
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove image"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <LayoutSelector
              selectedLayout={selectedLayout}
              onSelect={(layout) => {
                // Prevent selecting reference layout if no reference image
                if (layout === 'reference' && !uploadedImage) {
                  setError('Please upload a reference image first to use the reference dimension option.');
                  return;
                }
                setSelectedLayout(layout);
              }}
              hasReferenceImage={!!uploadedImage}
              selectedModel={selectedModel}
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
              <ImagePreview 
                imageUrl={generatedImage} 
                layout={selectedLayout} 
                referenceDimensions={selectedLayout === 'reference' ? referenceImageDimensions : null}
              />
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

