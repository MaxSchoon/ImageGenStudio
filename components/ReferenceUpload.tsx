'use client';

import { useRef } from 'react';

interface ReferenceUploadProps {
  uploadedImage: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isRequired: boolean;
}

export default function ReferenceUpload({
  uploadedImage,
  onFileSelect,
  onClear,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  isRequired,
}: ReferenceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-studio-text">
        Reference Image {isRequired ? '(Required)' : '(Optional)'}
      </label>
      {!uploadedImage ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-studio-accent bg-studio-accent/10'
              : 'border-studio-border hover:border-studio-muted'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <svg className="w-8 h-8 text-studio-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-studio-muted">Drop image here or click to select</p>
          <p className="text-xs text-studio-muted/60 mt-1">JPEG, PNG, or WebP (max 10MB)</p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-studio-border">
          <img
            src={uploadedImage}
            alt="Uploaded reference"
            className="w-full h-auto max-h-40 object-contain bg-studio-elevated"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
