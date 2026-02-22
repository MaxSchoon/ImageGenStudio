'use client';

import { useState, useRef } from 'react';
import StudioControls from './StudioControls';
import LoadingOverlay from './LoadingOverlay';
import ImagePreview from './ImagePreview';
import MobileBottomSheet from './MobileBottomSheet';
import Footer from './Footer';
import { generateImage } from '@/lib/nanobanana';
import { Layout, Model, MODEL_CAPABILITIES } from '@/lib/modelConfig';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_DIMENSION = 1024;
const COMPRESSION_QUALITY = 0.8;

function compressImage(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPEG, PNG, or WebP image.';
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
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const img = new Image();
        img.onload = async () => {
          setReferenceImageDimensions({ width: img.width, height: img.height });
          const capabilities = MODEL_CAPABILITIES[selectedModel];
          if (capabilities.supportedLayouts.includes('reference')) {
            setSelectedLayout('reference');
          }
          try {
            const compressed = await compressImage(result, MAX_IMAGE_DIMENSION, COMPRESSION_QUALITY);
            setUploadedImage(compressed);
          } catch {
            setUploadedImage(result);
          }
        };
        img.onerror = () => setError('Failed to load image dimensions.');
        img.src = result;
      }
    };
    reader.onerror = () => setError('Failed to read file. Please try again.');
    reader.readAsDataURL(file);
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
    if (file) handleFileSelect(file);
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setReferenceImageDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
    if (selectedLayout === 'reference') setSelectedLayout('square');
  };

  const handleModelSelect = (model: Model) => {
    const previousModel = selectedModel;
    const newCapabilities = MODEL_CAPABILITIES[model];
    const prevCapabilities = MODEL_CAPABILITIES[previousModel];

    setSelectedModel(model);

    if (!newCapabilities.supportsLayoutSelection) {
      setSelectedLayout('reference');
      if (!uploadedImage) {
        setError('Qwen requires a reference image. Please upload an image.');
      } else {
        setError(null);
      }
    } else if (!newCapabilities.supportedLayouts.includes(selectedLayout)) {
      setSelectedLayout('square');
      setError(`${selectedLayout} layout is not supported with this model. Switched to square layout.`);
    } else if (!newCapabilities.supportsReferenceImages && uploadedImage && prevCapabilities.supportsReferenceImages) {
      setError('Reference images are not supported with this model. Your image will be preserved when you switch to another model.');
    } else if (prevCapabilities.supportsReferenceImages || newCapabilities.supportsReferenceImages) {
      setError(null);
    }
  };

  const handleLayoutSelect = (layout: Layout) => {
    if (layout === 'reference' && !uploadedImage) {
      setError('Please upload a reference image first to use the reference dimension option.');
      return;
    }
    setSelectedLayout(layout);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: 'correct' }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.completion?.trim()) {
          setPrompt(data.completion.trim());
        }
      }
    } catch {
      // Silently fail — enhancement is optional
    } finally {
      setIsEnhancing(false);
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
      const imageDataToSend = uploadedImage || undefined;
      const layoutToUse = selectedLayout === 'reference' && referenceImageDimensions
        ? { type: 'reference' as const, width: referenceImageDimensions.width, height: referenceImageDimensions.height }
        : selectedLayout;

      const imageUrl = await generateImage(prompt, layoutToUse, selectedModel, imageDataToSend);
      setGeneratedImage(imageUrl);
      // Auto-collapse bottom sheet on mobile after successful generation
      setBottomSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  const controlsProps = {
    prompt,
    onPromptChange: setPrompt,
    onEnhancePrompt: handleEnhancePrompt,
    isEnhancing,
    selectedModel,
    onModelSelect: handleModelSelect,
    selectedLayout,
    onLayoutSelect: handleLayoutSelect,
    uploadedImage,
    onFileSelect: handleFileSelect,
    onClearImage: handleClearImage,
    isDragging,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    referenceDimensions: referenceImageDimensions,
    isLoading,
    error,
    onGenerate: handleGenerate,
  };

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 bg-studio-surface border-r border-studio-border flex-shrink-0">
        <div className="p-4 border-b border-studio-border">
          <h1 className="text-lg font-semibold text-studio-text">Image Studio</h1>
          <p className="text-studio-muted text-xs italic mt-1">
            &ldquo;It is the glory of God to conceal things, but the glory of kings is to search things out.&rdquo;&mdash;Proverbs 25:2
          </p>
        </div>
        <div className="flex-1 overflow-y-auto studio-scrollbar px-4 py-4">
          <StudioControls {...controlsProps} />
        </div>
        <div className="p-4 border-t border-studio-border">
          <Footer />
        </div>
      </aside>

      {/* Canvas */}
      <div className="flex-1 relative flex items-center justify-center bg-studio-bg p-4 overflow-hidden">
        {isLoading && <LoadingOverlay />}
        {generatedImage && !isLoading && (
          <ImagePreview
            imageUrl={generatedImage}
            layout={selectedLayout}
            referenceDimensions={selectedLayout === 'reference' ? referenceImageDimensions : null}
          />
        )}
        {!generatedImage && !isLoading && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-studio-surface border border-studio-border flex items-center justify-center">
              <svg className="w-8 h-8 text-studio-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-studio-muted text-sm">Your generated image will appear here</p>
            <p className="text-studio-muted/50 text-xs mt-1 lg:hidden">Swipe up to open controls</p>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <MobileBottomSheet
        isExpanded={bottomSheetOpen}
        onToggle={() => setBottomSheetOpen(!bottomSheetOpen)}
      >
        <StudioControls {...controlsProps} />
      </MobileBottomSheet>
    </div>
  );
}
