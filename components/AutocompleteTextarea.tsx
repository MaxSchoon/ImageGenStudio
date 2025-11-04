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
  const [ghostText, setGhostText] = useState(''); // Completion text
  const [correctionText, setCorrectionText] = useState(''); // Corrected text (replaces current)
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ghostTextRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const correctionAbortControllerRef = useRef<AbortController | null>(null);
  const tabPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTabPressTimeRef = useRef<number>(0);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the new height based on scrollHeight
    const scrollHeight = textarea.scrollHeight;
    
    // Get computed styles for more accurate minimum height calculation
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 12;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 12;
    
    // Calculate minimum height based on rows prop
    const minHeight = rows * lineHeight + paddingTop + paddingBottom;
    
    // Set the height to match content, with a minimum height
    const newHeight = Math.max(scrollHeight, minHeight);
    textarea.style.height = `${newHeight}px`;

    // Also update ghost text container height to match
    if (ghostTextRef.current) {
      ghostTextRef.current.style.height = `${newHeight}px`;
    }
  }, [value, ghostText, correctionText, rows]);

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
        body: JSON.stringify({ prompt, mode: 'complete' }),
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

  // Fetch correction from API
  const fetchCorrection = useCallback(async (prompt: string) => {
    // Cancel previous correction request if any
    if (correctionAbortControllerRef.current) {
      correctionAbortControllerRef.current.abort();
    }

    // Skip if prompt is empty or too short
    if (!prompt.trim() || prompt.trim().length < 3) {
      setCorrectionText('');
      setIsCorrecting(false);
      return;
    }

    // Create new abort controller
    const abortController = new AbortController();
    correctionAbortControllerRef.current = abortController;

    setIsCorrecting(true);

    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, mode: 'correct' }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch correction');
      }

      const data = await response.json();
      
      // Only set correction text if request wasn't aborted and it's different from current
      if (!abortController.signal.aborted && data.completion && data.completion.trim() !== prompt.trim()) {
        setCorrectionText(data.completion);
      } else {
        setCorrectionText('');
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error('Error fetching correction:', error);
      }
      setCorrectionText('');
    } finally {
      if (!abortController.signal.aborted) {
        setIsCorrecting(false);
      }
    }
  }, []);

  // Debounced completion fetch
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear ghost text and correction text immediately when value changes
    setGhostText('');
    setCorrectionText('');

    // Set up debounced fetch for completion
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
      if (correctionAbortControllerRef.current) {
        correctionAbortControllerRef.current.abort();
      }
    };
  }, [value, fetchCompletion]);

  // Fetch correction when user stops typing (for showing correction suggestions)
  useEffect(() => {
    // Only fetch correction if there's substantial text (at least 5 characters)
    if (value.trim().length >= 5) {
      const timer = setTimeout(() => {
        fetchCorrection(value);
      }, 600); // Slightly longer debounce for correction

      return () => clearTimeout(timer);
    } else {
      setCorrectionText('');
    }
  }, [value, fetchCorrection]);

  // Accept ghost text (completion) function
  const acceptGhostText = useCallback(() => {
    if (!ghostText) return;
    
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
  }, [ghostText, value, onChange]);

  // Accept correction function
  const acceptCorrection = useCallback(() => {
    if (!correctionText) return;
    
    onChange(correctionText);
    setCorrectionText('');
    
    // Focus back on textarea and move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = correctionText.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  }, [correctionText, onChange]);

  // Handle Tab key - single Tab for correction, double Tab for completion
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      const now = Date.now();
      const timeSinceLastTab = now - lastTabPressTimeRef.current;
      
      // If Tab pressed within 300ms of previous Tab, it's a double Tab (completion)
      if (timeSinceLastTab < 300 && tabPressTimerRef.current) {
        e.preventDefault();
        clearTimeout(tabPressTimerRef.current);
        lastTabPressTimeRef.current = 0;
        
        // Double Tab - accept completion
        if (ghostText) {
          acceptGhostText();
        }
      } else {
        // Single Tab - only accept correction (not completion)
        e.preventDefault();
        lastTabPressTimeRef.current = now;
        
        if (correctionText) {
          // Accept correction on single Tab
          acceptCorrection();
        }
        
        // Set up timer to detect double Tab (for completion)
        tabPressTimerRef.current = setTimeout(() => {
          lastTabPressTimeRef.current = 0;
        }, 300);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Dismiss both ghost text and correction
      setGhostText('');
      setCorrectionText('');
    }
  }, [ghostText, correctionText, acceptGhostText, acceptCorrection]);

  // Handle onChange
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Sync scroll between textarea and ghost text overlay
  const handleScroll = useCallback(() => {
    if (ghostTextRef.current && textareaRef.current) {
      ghostTextRef.current.scrollTop = textareaRef.current.scrollTop;
      ghostTextRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className={`relative w-full bg-white/90 backdrop-blur-sm rounded-lg overflow-hidden ${className}`}>
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
          className="whitespace-pre-wrap break-words w-full"
          style={{
            padding: '0.75rem 1rem',
            color: 'transparent',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {/* Show correction text if available, otherwise show user's text */}
          {correctionText ? (
            <>
              {/* Show corrected text in green/italic */}
              <span
                style={{
                  color: 'rgba(34, 197, 94, 0.6)',
                  fontStyle: 'italic',
                  textDecoration: 'underline',
                }}
              >
                {correctionText}
              </span>
              {/* Show ghost text after correction if available */}
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Actual textarea with transparent background to see ghost text */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder={isLoading ? 'Predicting...' : placeholder}
        className="relative w-full box-border px-4 py-3 bg-transparent rounded-lg border border-black/20 text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
        rows={rows}
        style={{
          position: 'relative',
          zIndex: 1,
          caretColor: 'black', // Ensure cursor is visible
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          overflow: 'hidden',
        }}
      />

      {/* Mobile buttons */}
      <div className="absolute bottom-2 left-2 right-2 sm:hidden flex gap-2 z-10">
        {/* Correct button (left side) */}
        {correctionText && (
          <button
            type="button"
            onClick={acceptCorrection}
            className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 active:bg-green-700 shadow-sm transition-colors"
            aria-label="Accept correction"
          >
            Correct
          </button>
        )}
        {/* Accept button (right side) */}
        {ghostText && (
          <button
            type="button"
            onClick={acceptGhostText}
            className="ml-auto px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 active:bg-blue-700 shadow-sm transition-colors"
            aria-label="Accept suggestion"
          >
            Accept
          </button>
        )}
      </div>

      {/* Desktop hints (hidden on mobile) */}
      <div className="absolute bottom-2 left-2 right-2 hidden sm:flex gap-2 pointer-events-none z-10">
        {correctionText && (
          <span className="text-xs text-green-600 bg-white/80 px-2 py-1 rounded">
            Tab to correct
          </span>
        )}
        {ghostText && (
          <span className="ml-auto text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
            Tab to accept • Tab Tab to complete
          </span>
        )}
      </div>

      {/* Loading indicators */}
      {(isLoading || isCorrecting) && ghostText === '' && correctionText === '' && (
        <div className="absolute right-4 top-4 pointer-events-none z-10">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

