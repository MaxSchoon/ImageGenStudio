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

  // Convert data URI to blob URL for opening in new tab and downloading
  const { blobUrl, isBlob } = useMemo(() => {
    // If it's already a regular URL (http/https), use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return { blobUrl: imageUrl, isBlob: false };
    }
    
    // If it's a data URI, convert to blob URL
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
      } catch (error) {
        console.error('Failed to convert data URI to blob:', error);
        return { blobUrl: imageUrl, isBlob: false }; // Fallback to original
      }
    }
    
    return { blobUrl: imageUrl, isBlob: false };
  }, [imageUrl]);

  // Clean up blob URL when component unmounts or image URL changes
  useEffect(() => {
    const previousBlobUrl = blobUrl;
    return () => {
      if (isBlob && previousBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrl);
      }
    };
  }, [blobUrl, isBlob]);

  const getAspectRatio = () => {
    switch (layout) {
      case 'landscape':
        return 'aspect-[16/9]';
      case 'mobile':
        return 'aspect-[9/16]';
      case 'square':
        return 'aspect-square';
      case 'reference':
        if (referenceDimensions) {
          const aspectRatio = referenceDimensions.width / referenceDimensions.height;
          return `aspect-[${aspectRatio}]`;
        }
        return 'aspect-square'; // Fallback
      default:
        return 'aspect-square';
    }
  };

  const handleOpenInNewTab = () => {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  const getDownloadFilename = () => {
    const extension = imageUrl.includes('image/png') ? 'png' : 
                     imageUrl.includes('image/jpeg') || imageUrl.includes('image/jpg') ? 'jpg' :
                     imageUrl.includes('image/webp') ? 'webp' : 'png';
    return `generated-image.${extension}`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-black/10 p-8">
      <h2 className="text-2xl font-bold text-black mb-6">Generated Image</h2>
      
      {imageError ? (
        <div className={`${getAspectRatio()} bg-gray-100 rounded-lg flex items-center justify-center border border-black/10`}>
          <p className="text-black/60">Failed to load image</p>
        </div>
      ) : (
        <div className={`${getAspectRatio()} rounded-lg overflow-hidden border border-black/10`}>
          <img
            src={imageUrl}
            alt="Generated image"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <a
          href={blobUrl}
          download={getDownloadFilename()}
          className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors text-center"
        >
          Download Image
        </a>
        <button
          onClick={handleOpenInNewTab}
          className="flex-1 px-6 py-3 bg-white/90 backdrop-blur-sm text-black font-semibold rounded-lg border border-black/20 hover:border-blue-300 transition-colors text-center"
        >
          Open in New Tab
        </button>
      </div>
    </div>
  );
}

