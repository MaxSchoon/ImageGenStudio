'use client';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
}

export default function PromptInput({ value, onChange, onEnhance, isEnhancing }: PromptInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-studio-text">Prompt</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the image you want to generate..."
        rows={4}
        className="w-full px-3 py-2.5 bg-studio-elevated border border-studio-border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:border-studio-accent focus:ring-1 focus:ring-studio-accent resize-none"
        style={{ caretColor: '#e0e0e0' }}
      />
      <button
        type="button"
        onClick={onEnhance}
        disabled={isEnhancing || !value.trim()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-studio-elevated border border-studio-border text-studio-muted hover:text-studio-text hover:border-studio-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isEnhancing ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enhancing...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Enhance Prompt
          </>
        )}
      </button>
    </div>
  );
}
