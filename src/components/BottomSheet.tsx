"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Max height as a Tailwind class, e.g. "max-h-[85vh]". Defaults to 85vh */
  maxHeightClass?: string;
  title?: string;
  children: React.ReactNode;
  /** Optional sticky footer slot */
  footer?: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  maxHeightClass = "max-h-[85vh]",
  title,
  children,
  footer,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-30 scrim transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-2xl border-t border-border bg-surface shadow-2xl pb-safe
          ${maxHeightClass}
          ${isOpen ? "sheet-open" : "sheet-enter"}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Optional title bar */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
            <span className="text-sm font-bold text-foreground">{title}</span>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Optional sticky footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
