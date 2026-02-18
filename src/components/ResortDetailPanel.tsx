"use client";

import { useState, useEffect, useCallback } from "react";
import { Resort, COLOR_MAP } from "@/types";
import { resorts as allResorts } from "@/data/resorts";
import {
  Mountain,
  MapPin,
  CalendarDays,
  Snowflake,
  Users,
  ExternalLink,
  X,
} from "lucide-react";

/* ── Helpers (shared logic with ResortCard) ──────────────── */

const SHARED_BANK_GROUPS = new Set<string>();
const groupCounts: Record<string, number> = {};
for (const r of allResorts) {
  if (r.group !== "Individual") {
    groupCounts[r.group] = (groupCounts[r.group] ?? 0) + 1;
  }
}
for (const [group, count] of Object.entries(groupCounts)) {
  if (count > 1) SHARED_BANK_GROUPS.add(group);
}

function getSharedBankResorts(resort: Resort): Resort[] {
  if (!SHARED_BANK_GROUPS.has(resort.group)) return [];
  return allResorts.filter(
    (r) => r.group === resort.group && r.id !== resort.id,
  );
}

function getPowderhoundsUrl(resort: Resort): string {
  const q = encodeURIComponent(`powderhounds ${resort.name} ski resort`);
  return `https://www.google.com/search?q=${q}&btnI`;
}

/* ── Pass Day Card ───────────────────────────────────────── */

function PassDayCard({ label, value }: { label: string; value: string }) {
  const isNA = value === "N/A";
  const isUnlimited = value.startsWith("Unlimited");

  return (
    <div className="rounded-lg bg-background p-3">
      <div className="flex items-center gap-1.5 text-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div
        className={`mt-1 text-xl font-bold ${
          isNA
            ? "text-muted/40"
            : isUnlimited
              ? "text-ikon"
              : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Resort Detail Panel ─────────────────────────────────── */

interface ResortDetailPanelProps {
  resort: Resort;
  onClose: () => void;
  onNavigate: (resort: Resort) => void;
}

export function ResortDetailPanel({
  resort,
  onClose,
  onNavigate,
}: ResortDetailPanelProps) {
  const color = COLOR_MAP[resort.colorGroup] ?? "#666";
  const sharedBank = getSharedBankResorts(resort);
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Reset image error state when resort changes
  useEffect(() => {
    setImgError(false);
  }, [resort.id]);

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
  }, []);

  // Escape key closes panel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="resort-detail-name"
      className={`
        absolute z-20
        w-full md:w-[400px]
        bottom-0 md:bottom-4 left-0 md:left-4
        transition-all duration-200 ease-out
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
      `}
    >
      {/* Upward-pointing triangle connector to map marker */}
      <div
        className="hidden md:block absolute -top-2 left-[30px] w-4 h-4 rotate-45 border-l border-t border-border bg-surface z-10"
      />

      {/* Card body */}
      <div className="rounded-t-xl md:rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 max-h-[70vh] overflow-y-auto relative">
      {/* Hero image section */}
      <div className="relative h-44 overflow-hidden rounded-t-xl bg-surface">
        {resort.imageUrl && !imgError ? (
          <img
            src={resort.imageUrl}
            alt={resort.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, var(--surface) 100%)`,
            }}
          >
            <Mountain className="h-12 w-12 text-muted/30" />
          </div>
        )}

        {/* Gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface via-surface/80 to-transparent" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
          aria-label="Close resort details"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Resort name overlaid on gradient */}
        <div className="absolute bottom-3 left-4 right-12">
          <h2
            id="resort-detail-name"
            className="text-lg font-bold leading-tight text-white drop-shadow-lg"
          >
            {resort.name}
          </h2>
          {resort.isNew && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-ikon/20 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-ikon">
              <Snowflake className="h-3 w-3" />
              New 25/26
            </span>
          )}
        </div>
      </div>

      {/* Color accent bar */}
      <div className="h-1" style={{ backgroundColor: color }} />

      {/* Info body */}
      <div className="px-5 py-4">
        {/* Location row */}
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{resort.country}</span>
          <span className="text-border">·</span>
          <span>{resort.macroRegion}</span>
          {resort.group !== "Individual" && (
            <>
              <span className="text-border">·</span>
              <span>{resort.group}</span>
            </>
          )}
        </div>

        {/* Pass day cards */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PassDayCard label="Full Pass" value={resort.fullPassDays} />
          <PassDayCard label="Base Pass" value={resort.basePassDays} />
        </div>

        {/* Notes */}
        {resort.notes && (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {resort.notes}
          </p>
        )}

        {/* Shared day bank */}
        {sharedBank.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Users className="h-3.5 w-3.5" />
              Shared day bank
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
              {sharedBank.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onNavigate(r)}
                  className="text-xs text-ikon hover:underline"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Powderhounds link */}
        <a
          href={getPowderhoundsUrl(resort)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover hover:border-ikon/30 transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-ikon" />
          View on Powderhounds
        </a>
      </div>
      </div>{/* end card body */}
    </div>
  );
}
