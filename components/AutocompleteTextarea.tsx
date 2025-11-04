'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AutocompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  id?: string;
}

export default function AutocompleteTextarea({
  value,
  onChange,
  placeholder = '',
  className = '',
  rows = 4,
  id,
}: AutocompleteTextareaProps) {
  const [ghostText, setGhostText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ghostTextRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch completion from API
  const fetchCompletion = useCallback(async (prompt: string) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Skip if prompt is empty or too short
    if (!prompt.trim() || prompt.trim().length < 3) {
      setGhostText('');
      setIsLoading(false);
      return;
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);

    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch completion');
      }

      const data = await response.json();
      
      // Only set ghost text if request wasn't aborted
      if (!abortController.signal.aborted && data.completion) {
        setGhostText(data.completion);
      } else {
        setGhostText('');
      }
    } catch (error: any) {
      // Ignore abort errors (these are expected when user keeps typing)
      if (error.name !== 'AbortError') {
        console.error('Error fetching completion:', error);
      }
      setGhostText('');
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced completion fetch
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear ghost text immediately when value changes
    setGhostText('');

    // Set up debounced fetch
    debounceTimerRef.current = setTimeout(() => {
      fetchCompletion(value);
    }, 400); // 400ms debounce delay

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, fetchCompletion]);

  // Handle Tab key to accept ghost text
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      // Accept ghost text
      const newValue = value + ghostText;
      onChange(newValue);
      setGhostText('');
      
      // Focus back on textarea and move cursor to end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const length = newValue.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 0);
    } else if (e.key === 'Escape' && ghostText) {
      e.preventDefault();
      // Dismiss ghost text
      setGhostText('');
    }
  }, [ghostText, value, onChange]);

  // Sync scroll between textarea and ghost text overlay
  const handleScroll = useCallback(() => {
    if (ghostTextRef.current && textareaRef.current) {
      ghostTextRef.current.scrollTop = textareaRef.current.scrollTop;
      ghostTextRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className={`relative w-full bg-white/90 backdrop-blur-sm rounded-lg ${className}`}>
      {/* Ghost text overlay - positioned behind textarea */}
      <div
        ref={ghostTextRef}
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
        }}
      >
        <div
          className="whitespace-pre-wrap break-words h-full w-full"
          style={{
            padding: '0.75rem 1rem',
            color: 'transparent',
          }}
        >
          {/* Show user's text as transparent to match textarea */}
          <span>{value}</span>
          {/* Show ghost text in gray/italic */}
          {ghostText && (
            <span
              style={{
                color: 'rgba(0, 0, 0, 0.35)',
                fontStyle: 'italic',
              }}
            >
              {ghostText}
            </span>
          )}
        </div>
      </div>

      {/* Actual textarea with transparent background to see ghost text */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder={isLoading ? 'Predicting...' : placeholder}
        className="relative w-full px-4 py-3 bg-transparent rounded-lg border border-black/20 text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={rows}
        style={{
          position: 'relative',
          zIndex: 1,
          caretColor: 'black', // Ensure cursor is visible
        }}
      />

      {/* Loading indicator (optional, subtle) */}
      {isLoading && ghostText === '' && (
        <div className="absolute right-4 top-4 pointer-events-none z-10">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

