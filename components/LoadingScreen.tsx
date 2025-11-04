'use client';

export default function LoadingScreen() {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-black/10 p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-black text-lg font-medium">Generating your image...</p>
        <p className="text-black/60 text-sm mt-2">This may take a few moments</p>
      </div>
    </div>
  );
}

