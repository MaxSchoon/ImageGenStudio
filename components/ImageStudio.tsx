'use client';

import { useState, useRef } from 'react';
import StudioControls from './StudioControls';
import LoadingOverlay from './LoadingOverlay';
import ImagePreview from './ImagePreview';
import StorybookPreview, { StorybookPage } from './StorybookPreview';
import OgPackagePreview, { OgPackageAsset } from './OgPackagePreview';
import MobileBottomSheet from './MobileBottomSheet';
import { generateImage } from '@/lib/imageGeneration';
import { buildCreatorPrompt, buildStorybookPagePrompts, CreatorPreset, getOgPackageExportPresets } from '@/lib/creatorContent';
import { OG_MASTER_PRESET_ID } from '@/lib/og/presets';
import { DEFAULT_MODEL, Layout, Model, MODEL_CAPABILITIES, OPENROUTER_MODEL_BY_VALUE, getLayoutConfig } from '@/lib/modelConfig';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_DIMENSION = 1024;
const COMPRESSION_QUALITY = 0.8;

async function formatPresetImage(image: string, preset: CreatorPreset): Promise<string> {
  if (!image.startsWith('data:image')) {
    throw new Error(`Generated ${preset.shortLabel} output must be image data before exact export formatting.`);
  }

  const response = await fetch('/api/format', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image,
      width: preset.width,
      height: preset.height,
      format: preset.exportFormat || 'png',
      quality: preset.exportQuality,
      maxFileSizeKb: preset.maxFileSizeKb,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || `Failed to export ${preset.dimensions} image.`);
  }

  const data = await response.json();
  if (!data.image) {
    throw new Error(`Failed to export ${preset.dimensions} image.`);
  }

  return data.image;
}

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
  const [selectedCreatorPreset, setSelectedCreatorPreset] = useState<CreatorPreset | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model>(DEFAULT_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [storybookPages, setStorybookPages] = useState<StorybookPage[]>([]);
  const [storybookProgress, setStorybookProgress] = useState<string | null>(null);
  const [ogPackageAssets, setOgPackageAssets] = useState<OgPackageAsset[]>([]);
  const [ogPackageProgress, setOgPackageProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceImageDimensions, setReferenceImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingMode = selectedCreatorPreset?.workflow === 'storybook'
    ? 'storybook'
    : selectedCreatorPreset?.workflow === 'og-package'
      ? 'og-package'
      : selectedCreatorPreset?.workflow === 'enhance'
        ? 'enhance'
        : 'image';

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
        setError(`${OPENROUTER_MODEL_BY_VALUE[model].label} requires a reference image. Please upload an image.`);
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
    setSelectedCreatorPreset(null);
    setGeneratedImage(null);
    setStorybookPages([]);
  };

  const handleCreatorPresetSelect = (preset: CreatorPreset | null) => {
    setSelectedCreatorPreset(preset);
    setGeneratedImage(null);
    setStorybookPages([]);
    setOgPackageAssets([]);
    if (preset) {
      setSelectedLayout(preset.generationLayout);
      if (preset.workflow === 'enhance' && !uploadedImage) {
        setError('Upload an image first to use enhancement mode.');
      } else {
        setError(null);
      }
    }
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

    if (selectedCreatorPreset?.workflow === 'enhance' && !uploadedImage) {
      setError('Upload an image first to use enhancement mode.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setStorybookPages([]);
    setStorybookProgress(null);
    setOgPackageAssets([]);
    setOgPackageProgress(null);

    try {
      const imageDataToSend = uploadedImage || undefined;
      const generationLayout = selectedCreatorPreset?.generationLayout || selectedLayout;
      const layoutToUse = generationLayout === 'reference' && referenceImageDimensions
        ? { type: 'reference' as const, width: referenceImageDimensions.width, height: referenceImageDimensions.height }
        : generationLayout;

      if (selectedCreatorPreset?.workflow === 'og-package') {
        const masterPreset = getOgPackageExportPresets().find((preset) => preset.id === OG_MASTER_PRESET_ID)
          || selectedCreatorPreset;
        const exportPresets = getOgPackageExportPresets();
        const promptToSend = buildCreatorPrompt(prompt, selectedCreatorPreset);
        setOgPackageProgress('Rendering master preview');
        const masterImage = await generateImage(promptToSend, masterPreset.generationLayout, selectedModel, imageDataToSend);
        const assets: OgPackageAsset[] = [];
        const failedExports: string[] = [];

        for (const exportPreset of exportPresets) {
          setOgPackageProgress(`Exporting ${exportPreset.shortLabel}`);
          try {
            const formattedImage = await formatPresetImage(masterImage, exportPreset);
            const extension = exportPreset.exportFormat === 'jpeg' ? 'jpg' : 'png';
            assets.push({
              presetId: exportPreset.id,
              label: exportPreset.label,
              shortLabel: exportPreset.shortLabel,
              platform: exportPreset.ogPlatform || 'universal',
              dimensions: exportPreset.dimensions,
              width: exportPreset.width,
              height: exportPreset.height,
              imageUrl: formattedImage,
              filename: `${exportPreset.id}.${extension}`,
            });
          } catch (exportError) {
            failedExports.push(exportPreset.shortLabel);
            console.error(`Failed to export ${exportPreset.id}:`, exportError);
          }
        }

        if (assets.length === 0) {
          throw new Error('All social preview exports failed. Try simplifying the brief and generating again.');
        }

        if (failedExports.length > 0) {
          setError(`Some exports failed (${failedExports.join(', ')}). Successful variants are shown below.`);
        }

        setOgPackageAssets(assets);
        setGeneratedImage(null);
        setBottomSheetOpen(false);
        return;
      }

      if (selectedCreatorPreset?.workflow === 'storybook') {
        const pagePrompts = buildStorybookPagePrompts(prompt, selectedCreatorPreset);
        const generatedPages: StorybookPage[] = [];

        for (const pagePrompt of pagePrompts) {
          setStorybookProgress(`Page ${pagePrompt.pageNumber} of ${pagePrompts.length}: ${pagePrompt.title}`);
          const imageUrl = await generateImage(pagePrompt.prompt, layoutToUse, selectedModel, imageDataToSend);
          const formattedImage = await formatPresetImage(imageUrl, selectedCreatorPreset);
          generatedPages.push({
            pageNumber: pagePrompt.pageNumber,
            title: pagePrompt.title,
            role: pagePrompt.role,
            imageUrl: formattedImage,
          });
        }

        setStorybookPages(generatedPages);
        setGeneratedImage(null);
        setBottomSheetOpen(false);
        return;
      }

      const promptToSend = buildCreatorPrompt(prompt, selectedCreatorPreset);
      const imageUrl = await generateImage(promptToSend, layoutToUse, selectedModel, imageDataToSend);
      let finalImageUrl = imageUrl;

      if (selectedCreatorPreset && imageUrl.startsWith('data:image')) {
        finalImageUrl = await formatPresetImage(imageUrl, selectedCreatorPreset);
      }

      setGeneratedImage(finalImageUrl);
      // Auto-collapse bottom sheet on mobile after successful generation
      setBottomSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
      setStorybookProgress(null);
      setOgPackageProgress(null);
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
    selectedCreatorPreset,
    onCreatorPresetSelect: handleCreatorPresetSelect,
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

  const layoutConfig = getLayoutConfig(selectedLayout, selectedModel);
  const activeSummary = selectedCreatorPreset
    ? {
        title: selectedCreatorPreset.shortLabel,
        detail: selectedCreatorPreset.workflow === 'storybook'
          ? `5 pages · ${selectedCreatorPreset.dimensions} PDF via ${OPENROUTER_MODEL_BY_VALUE[selectedModel].shortLabel}`
          : selectedCreatorPreset.workflow === 'og-package'
            ? `${selectedCreatorPreset.dimensions} via ${OPENROUTER_MODEL_BY_VALUE[selectedModel].shortLabel}`
            : `${selectedCreatorPreset.dimensions} export via ${OPENROUTER_MODEL_BY_VALUE[selectedModel].shortLabel}`,
      }
    : {
        title: 'Freeform image',
        detail: `${layoutConfig.label} ${layoutConfig.dimensions} via ${OPENROUTER_MODEL_BY_VALUE[selectedModel].shortLabel}`,
      };

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 bg-studio-surface border-r border-studio-border flex-shrink-0">
        <div className="p-4 border-b border-studio-border">
          <h1 className="text-lg font-semibold text-studio-text">Image Studio</h1>
          <p className="mt-1 text-xs text-studio-muted">{activeSummary.title} · {activeSummary.detail}</p>
        </div>
        <div className="flex-1 overflow-y-auto studio-scrollbar px-4 py-4">
          <StudioControls {...controlsProps} />
        </div>
      </aside>

      {/* Canvas */}
      <div className="flex-1 relative flex items-center justify-center bg-studio-bg p-4 overflow-hidden">
        {isLoading && (
          <LoadingOverlay
            mode={loadingMode}
            label={selectedCreatorPreset?.shortLabel}
            dimensions={selectedCreatorPreset?.dimensions}
            progressLabel={storybookProgress || ogPackageProgress}
          />
        )}
        {ogPackageAssets.length > 0 && !isLoading && selectedCreatorPreset?.workflow === 'og-package' && (
          <OgPackagePreview
            assets={ogPackageAssets}
            metaInput={{
              url: 'https://your-domain.com',
              title: prompt || 'Website preview',
              description: prompt || 'Website preview image',
              siteName: 'Your Site',
              themeColor: '#1a1a1a',
            }}
          />
        )}
        {storybookPages.length > 0 && !isLoading && selectedCreatorPreset?.workflow === 'storybook' && (
          <StorybookPreview
            pages={storybookPages}
            dimensions={{
              width: selectedCreatorPreset.width,
              height: selectedCreatorPreset.height,
              label: selectedCreatorPreset.shortLabel,
            }}
            title={prompt || 'LinkedIn storybook'}
          />
        )}
        {generatedImage && !isLoading && (
          <ImagePreview
            imageUrl={generatedImage}
            layout={selectedCreatorPreset?.generationLayout || selectedLayout}
            referenceDimensions={(selectedCreatorPreset?.generationLayout || selectedLayout) === 'reference' ? referenceImageDimensions : null}
            outputDimensions={selectedCreatorPreset ? {
              width: selectedCreatorPreset.width,
              height: selectedCreatorPreset.height,
              label: selectedCreatorPreset.shortLabel,
            } : null}
          />
        )}
        {!generatedImage && storybookPages.length === 0 && ogPackageAssets.length === 0 && !isLoading && (
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
        summary={
          <div>
            <div className="text-sm font-semibold text-studio-text">{activeSummary.title}</div>
            <div className="mt-0.5 text-xs text-studio-muted">{activeSummary.detail}</div>
          </div>
        }
      >
        <StudioControls {...controlsProps} />
      </MobileBottomSheet>
    </div>
  );
}
