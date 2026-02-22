'use client';

import { useRef, useCallback } from 'react';

interface MobileBottomSheetProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

const COLLAPSED_HEIGHT = 140;
const DRAG_THRESHOLD = 50;

export default function MobileBottomSheet({ children, isExpanded, onToggle }: MobileBottomSheetProps) {
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
      className="fixed inset-x-0 bottom-0 lg:hidden z-40 transition-transform duration-300 ease-out pb-safe-area"
      style={{
        height: '85dvh',
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
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onToggle}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-1 pb-2"
        >
          <div className="drag-handle" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto studio-scrollbar px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
