'use client';

import { useState } from 'react';

type Layout = 'landscape' | 'mobile' | 'square';

interface ImagePreviewProps {
  imageUrl: string;
  layout: Layout;
}

export default function ImagePreview({ imageUrl, layout }: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const getAspectRatio = () => {
    switch (layout) {
      case 'landscape':
        return 'aspect-[16/9]';
      case 'mobile':
        return 'aspect-[9/16]';
      case 'square':
        return 'aspect-square';
      default:
        return 'aspect-square';
    }
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
          href={imageUrl}
          download
          className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors text-center"
        >
          Download Image
        </a>
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-6 py-3 bg-white/90 backdrop-blur-sm text-black font-semibold rounded-lg border border-black/20 hover:border-blue-300 transition-colors text-center"
        >
          Open in New Tab
        </a>
      </div>
    </div>
  );
}

