"use client";

import { useState } from "react";
import { Resort, COLOR_MAP } from "@/types";
import { resorts as allResorts } from "@/data/resorts";
import { wikiThumb } from "@/lib/wikiThumb";
import {
  Mountain,
  MapPin,
  CalendarDays,
  Snowflake,
  Users,
  ExternalLink,
} from "lucide-react";

/** Groups that share a day bank (more than 1 resort in the group, non-Individual) */
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

/* ── Pass day pill ────────────────────────────────────────── */
function PassPill({ label, value }: { label: string; value: string }) {
  const isNA = value === "N/A";
  const isUnlimited = value.startsWith("Unlimited");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isNA
          ? "bg-surface text-muted/50"
          : isUnlimited
            ? "bg-ikon/10 text-ikon"
            : "bg-surface text-foreground border border-border"
      }`}
    >
      <CalendarDays className="h-2.5 w-2.5" />
      {label}: {value}
    </span>
  );
}

/* ── Resort Card ──────────────────────────────────────────── */
interface ResortCardProps {
  resort: Resort;
  isSelected: boolean;
  onClick: () => void;
  onNavigate?: (resort: Resort) => void;
}

export function ResortCard({
  resort,
  isSelected,
  onClick,
  onNavigate,
}: ResortCardProps) {
  const color = COLOR_MAP[resort.colorGroup] ?? "#666";
  const sharedBank = getSharedBankResorts(resort);
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors border-l-[3px] hover:bg-surface-hover ${
        isSelected
          ? "border-l-ikon bg-surface-hover"
          : "border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Image thumbnail */}
        <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-card">
          {resort.imageUrl && !imgError ? (
            <img
              src={wikiThumb(resort.imageUrl, 200)}
              alt={resort.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Mountain className="h-5 w-5" style={{ color }} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + New badge */}
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {resort.name}
            </span>
            {resort.isNew && (
              <span className="flex-shrink-0 inline-flex items-center gap-0.5 rounded-full bg-ikon/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ikon">
                <Snowflake className="h-2.5 w-2.5" />
                New
              </span>
            )}
          </div>

          {/* Country + Group */}
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{resort.country}</span>
            {resort.group !== "Individual" && (
              <>
                <span className="text-border">·</span>
                <span className="truncate">{resort.group}</span>
              </>
            )}
          </div>

          {/* Pass day pills */}
          <div className="mt-1.5 flex gap-2">
            <PassPill label="Full" value={resort.fullPassDays} />
            <PassPill label="Base" value={resort.basePassDays} />
          </div>

          {/* Notes */}
          {resort.notes && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted/70 line-clamp-2">
              {resort.notes}
            </p>
          )}

          {/* Shared bank */}
          {sharedBank.length > 0 && (
            <div className="mt-1.5 flex items-start gap-1">
              <Users className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted" />
              <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                {sharedBank.map((r, i) => (
                  <span
                    key={r.id}
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.(r);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onNavigate?.(r);
                      }
                    }}
                    className="cursor-pointer text-[11px] text-ikon hover:underline"
                  >
                    {r.name}
                    {i < sharedBank.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Powderhounds link */}
          <a
            href={getPowderhoundsUrl(resort)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-ikon hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Powderhounds
          </a>
        </div>
      </div>
    </button>
  );
}
