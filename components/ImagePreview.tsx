'use client';

import { useState, useMemo, useEffect } from 'react';

type Layout = 'landscape' | 'mobile' | 'square' | 'reference';

interface ImagePreviewProps {
  imageUrl: string;
  layout: Layout;
  referenceDimensions?: { width: number; height: number } | null;
}

export default function ImagePreview({ imageUrl, layout, referenceDimensions }: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const { blobUrl, isBlob } = useMemo(() => {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return { blobUrl: imageUrl, isBlob: false };
    }
    if (imageUrl.startsWith('data:image')) {
      try {
        const [header, base64Data] = imageUrl.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        return { blobUrl: URL.createObjectURL(blob), isBlob: true };
      } catch {
        return { blobUrl: imageUrl, isBlob: false };
      }
    }
    return { blobUrl: imageUrl, isBlob: false };
  }, [imageUrl]);

  useEffect(() => {
    const previousBlobUrl = blobUrl;
    return () => {
      if (isBlob && previousBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrl);
      }
    };
  }, [blobUrl, isBlob]);

  const getMaxDimensions = () => {
    switch (layout) {
      case 'landscape':
        return 'max-w-full max-h-[80vh] aspect-[16/9]';
      case 'mobile':
        return 'max-w-sm max-h-[80vh] aspect-[9/16]';
      case 'square':
        return 'max-w-2xl max-h-[80vh] aspect-square';
      case 'reference':
        if (referenceDimensions) {
          const ratio = referenceDimensions.width / referenceDimensions.height;
          if (ratio > 1) return 'max-w-full max-h-[80vh]';
          return 'max-w-sm max-h-[80vh]';
        }
        return 'max-w-2xl max-h-[80vh] aspect-square';
      default:
        return 'max-w-2xl max-h-[80vh] aspect-square';
    }
  };

  const getDownloadFilename = () => {
    const extension = imageUrl.includes('image/png') ? 'png' :
                     imageUrl.includes('image/jpeg') || imageUrl.includes('image/jpg') ? 'jpg' :
                     imageUrl.includes('image/webp') ? 'webp' : 'png';
    return `generated-image.${extension}`;
  };

  const handleOpenInNewTab = () => {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  if (imageError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-studio-muted">Failed to load image</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={imageUrl}
        alt="Generated image"
        className={`${getMaxDimensions()} object-contain mx-auto rounded-lg`}
        onError={() => setImageError(true)}
      />

      {/* Floating action bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={blobUrl}
          download={getDownloadFilename()}
          className="px-4 py-2 bg-studio-surface/90 backdrop-blur-sm text-studio-text text-sm font-medium rounded-lg border border-studio-border hover:bg-studio-elevated transition-colors"
        >
          Download
        </a>
        <button
          onClick={handleOpenInNewTab}
          className="px-4 py-2 bg-studio-surface/90 backdrop-blur-sm text-studio-text text-sm font-medium rounded-lg border border-studio-border hover:bg-studio-elevated transition-colors"
        >
          Open in Tab
        </button>
      </div>
    </div>
  );
}
