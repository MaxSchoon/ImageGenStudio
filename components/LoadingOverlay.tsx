'use client';

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/80 backdrop-blur-sm z-10 rounded-lg">
      <div className="flex flex-col items-center">
        <div className="relative w-12 h-12 mb-3">
          <div className="absolute inset-0 border-3 border-studio-border border-t-studio-accent rounded-full animate-spin" />
        </div>
        <p className="text-studio-text text-sm font-medium">Generating...</p>
      </div>
    </div>
  );
}
