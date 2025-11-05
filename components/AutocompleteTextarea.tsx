'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const INITIAL_CORRECTION_DELAY_MS = 3000;
const POST_COMPLETION_DELAY_MS = 8000;

interface AutocompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  id: string;
}

export default function AutocompleteTextarea({
  value,
  onChange,
  placeholder = '',
  className = '',
  rows = 4,
  id,
}: AutocompleteTextareaProps) {
  const [correctionText, setCorrectionText] = useState(''); // Corrected text (improved version)
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const correctionAbortControllerRef = useRef<AbortController | null>(null);
  const pendingSuggestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuggestionTimestampRef = useRef<number>(0);
  const hasProvidedSuggestionRef = useRef<boolean>(false);

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

    // Also update overlay container height to match
    if (overlayRef.current) {
      overlayRef.current.style.height = `${newHeight}px`;
    }
  }, [value, correctionText, rows]);

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
        lastSuggestionTimestampRef.current = Date.now();
        hasProvidedSuggestionRef.current = true;
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

  // Fetch correction when user stops typing (only when focused)
  useEffect(() => {
    // Only fetch suggestions when textarea is focused
    if (!isFocused) {
      setCorrectionText('');
      if (pendingSuggestionTimerRef.current) {
        clearTimeout(pendingSuggestionTimerRef.current);
        pendingSuggestionTimerRef.current = null;
      }
      return;
    }

    // Only fetch correction if there's substantial text (at least 5 characters)
    if (value.trim().length >= 5) {
      const now = Date.now();
      const baseDelay = hasProvidedSuggestionRef.current ? POST_COMPLETION_DELAY_MS : INITIAL_CORRECTION_DELAY_MS;
      const earliestNextAllowed = lastSuggestionTimestampRef.current + baseDelay;
      const cooldownRemaining = Math.max(earliestNextAllowed - now, 0);
      const delay = Math.max(baseDelay, cooldownRemaining);

      if (pendingSuggestionTimerRef.current) {
        clearTimeout(pendingSuggestionTimerRef.current);
      }

      const timer = setTimeout(() => {
        fetchCorrection(value);
        pendingSuggestionTimerRef.current = null;
      }, delay); // Enforce minimum delay before requesting suggestion

      pendingSuggestionTimerRef.current = timer;

      return () => {
        if (pendingSuggestionTimerRef.current) {
          clearTimeout(pendingSuggestionTimerRef.current);
          pendingSuggestionTimerRef.current = null;
        } else {
          clearTimeout(timer);
        }
      };
    } else {
      setCorrectionText('');
      if (pendingSuggestionTimerRef.current) {
        clearTimeout(pendingSuggestionTimerRef.current);
        pendingSuggestionTimerRef.current = null;
      }
    }
  }, [value, fetchCorrection, isFocused]);

  // Accept correction function
  const acceptCorrection = useCallback(() => {
    if (!correctionText) return;
    
    onChange(correctionText);
    setCorrectionText('');
    lastSuggestionTimestampRef.current = Date.now();
    hasProvidedSuggestionRef.current = true;
    if (pendingSuggestionTimerRef.current) {
      clearTimeout(pendingSuggestionTimerRef.current);
      pendingSuggestionTimerRef.current = null;
    }
    
    // Focus back on textarea and move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = correctionText.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  }, [correctionText, onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      // Tab - accept correction
      if (correctionText) {
        e.preventDefault();
        acceptCorrection();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Dismiss correction
      setCorrectionText('');
    }
  }, [correctionText, acceptCorrection]);

  // Handle onChange
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Handle focus - enable suggestions
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle blur - clear suggestions (but not if clicking on buttons)
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Check if the blur is caused by clicking on our button
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (
      relatedTarget.closest('button[aria-label="Accept correction"]')
    )) {
      // Don't clear suggestions if clicking on button
      return;
    }

    setIsFocused(false);
    // Cancel any pending requests first
    if (correctionAbortControllerRef.current) {
      correctionAbortControllerRef.current.abort();
    }
    // Clear suggestions immediately
    setCorrectionText('');
    setIsCorrecting(false);
  }, []);

  // Effect to clear suggestions when not focused
  useEffect(() => {
    if (!isFocused) {
      setCorrectionText('');
      // Cancel any pending requests
      if (correctionAbortControllerRef.current) {
        correctionAbortControllerRef.current.abort();
      }
      setIsCorrecting(false);
    }
  }, [isFocused]);

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Calculate ghost text suffix - the portion of correctionText that comes after value
  const ghostTextSuffix = useMemo(() => {
    if (!isFocused || !correctionText) return '';

    const userInput = value;
    const suggestion = correctionText;

    if (!userInput) {
      return suggestion;
    }

    const minLength = Math.min(userInput.length, suggestion.length);
    let commonPrefixLength = 0;

    while (
      commonPrefixLength < minLength &&
      userInput[commonPrefixLength]?.toLowerCase() === suggestion[commonPrefixLength]?.toLowerCase()
    ) {
      commonPrefixLength += 1;
    }

    if (commonPrefixLength === userInput.length && suggestion.toLowerCase().startsWith(userInput.toLowerCase())) {
      return suggestion.slice(userInput.length);
    }

    if (commonPrefixLength === 0) {
      return suggestion;
    }

    return suggestion.slice(commonPrefixLength);
  }, [value, correctionText, isFocused]);

  return (
    <div className={`relative w-full max-w-full min-w-0 bg-white/90 backdrop-blur-sm rounded-lg overflow-hidden ${className}`}>
      {/* Overlay - positioned behind textarea to show corrected text as ghost text */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          zIndex: 0,
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
          {/* Only show suggestions when focused */}
          {isFocused && correctionText ? (
            <>
              {/* Show user's text (transparent) followed by ghost text suffix */}
              <span style={{ color: 'transparent' }}>{value}</span>
              {ghostTextSuffix && (
                <span
                  style={{
                    color: 'rgba(0, 0, 0, 0.35)',
                    fontStyle: 'italic',
                  }}
                >
                  {ghostTextSuffix}
                </span>
              )}
            </>
          ) : (
            /* When not focused or no correction, show user's text (transparent) */
            <span>{value}</span>
          )}
        </div>
      </div>

      {/* Actual textarea - show user's text more transparently when correction is available */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={isCorrecting ? 'Improving...' : placeholder}
        className="relative w-full min-w-0 box-border px-4 py-3 bg-transparent rounded-lg border border-black/20 text-black placeholder-black/50 focus:outline-none focus:border-blue-500 focus:border-2 resize-none overflow-hidden"
        rows={rows}
        style={{
          position: 'relative',
          zIndex: 1,
          caretColor: 'black', // Ensure cursor is visible
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          color: 'rgb(0, 0, 0)',
        }}
      />

      {/* Mobile buttons (only show when focused and correction available) */}
      {isFocused && correctionText && (
        <div className="absolute bottom-2 left-2 right-2 sm:hidden flex gap-2 z-10">
          {/* Correct button */}
          <button
            type="button"
            onMouseDown={(e) => {
              // Prevent textarea blur when clicking button
              e.preventDefault();
              acceptCorrection();
            }}
            onTouchStart={(e) => {
              // Prevent textarea blur when tapping button on mobile
              e.preventDefault();
              acceptCorrection();
            }}
            className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-md hover:bg-teal-700 active:bg-teal-800 shadow-sm transition-colors"
            aria-label="Accept correction"
          >
            Accept
          </button>
        </div>
      )}

      {/* Desktop hints (hidden on mobile, only show when focused and correction available) */}
      {isFocused && correctionText && (
        <div className="absolute bottom-2 left-2 right-2 hidden sm:flex gap-2 pointer-events-none z-10">
          <span className="text-xs text-teal-600 bg-white/80 px-2 py-1 rounded">
            Tab to accept
          </span>
        </div>
      )}

      {/* Loading indicator */}
      {isCorrecting && !correctionText && (
        <div className="absolute right-4 top-4 pointer-events-none z-10">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
