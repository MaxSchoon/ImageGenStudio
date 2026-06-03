'use client';

import { useRef, useCallback } from 'react';

interface MobileBottomSheetProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  summary?: React.ReactNode;
}

const COLLAPSED_HEIGHT = 140;
const DRAG_THRESHOLD = 50;

export default function MobileBottomSheet({ children, isExpanded, onToggle, summary }: MobileBottomSheetProps) {
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const deltaY = e.changedTouches[0].clientY - startYRef.current;

    if (isExpanded && deltaY > DRAG_THRESHOLD) {
      onToggle(); // Collapse
    } else if (!isExpanded && deltaY < -DRAG_THRESHOLD) {
      onToggle(); // Expand
    }
  }, [isExpanded, onToggle]);

  return (
    <div
      className="fixed inset-x-0 bottom-16 lg:hidden z-40 transition-transform duration-300 ease-out"
      style={{
        height: 'calc(85dvh - 4rem)',
        transform: isExpanded ? 'translateY(0)' : `translateY(calc(100% - ${COLLAPSED_HEIGHT}px))`,
      }}
    >
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 -z-10"
          onClick={onToggle}
        />
      )}

      <div className="h-full bg-studio-surface rounded-t-2xl border-t border-studio-border flex flex-col shadow-2xl">
        {/* Drag handle and active workflow summary */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onToggle}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing px-4 pb-3 pt-1"
        >
          <div className="drag-handle" />
          {summary && (
            <div className="flex items-center justify-between gap-3">
              {summary}
              <span className="shrink-0 rounded-md border border-studio-border px-2 py-1 text-xs font-medium text-studio-muted">
                {isExpanded ? 'Hide' : 'Edit'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto studio-scrollbar px-4 pb-4 ${isExpanded ? 'block' : 'hidden'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
