"use client";

import { Resort, COLOR_MAP } from "@/types";
import { resorts as allResorts } from "@/data/resorts";

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
    (r) => r.group === resort.group && r.id !== resort.id
  );
}

function getPowderhoundsUrl(resort: Resort): string {
  const q = encodeURIComponent(`powderhounds ${resort.name} ski resort`);
  return `https://www.google.com/search?q=${q}&btnI`;
}

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

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-3 transition-colors hover:bg-surface-hover ${
        isSelected ? "bg-surface-hover" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <div className="mt-1 relative flex-shrink-0">
          <span
            className="block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          {resort.isNew && (
            <span
              className="absolute -top-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full bg-ikon"
              title="New for 25/26"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Resort name */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {resort.name}
            </span>
            {resort.isNew && (
              <span className="flex-shrink-0 rounded bg-ikon/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ikon">
                New
              </span>
            )}
          </div>

          {/* Ikon Group (only for non-Individual) */}
          {resort.group !== "Individual" && (
            <div className="mt-0.5 text-xs text-muted">{resort.group}</div>
          )}

          {/* Pass days */}
          <div className="mt-1 flex gap-3 text-[11px]">
            <span className="text-muted">
              Full:{" "}
              <span className="text-foreground font-medium">
                {resort.fullPassDays}
              </span>
            </span>
            <span className="text-muted">
              Base:{" "}
              <span className="text-foreground font-medium">
                {resort.basePassDays}
              </span>
            </span>
          </div>

          {/* Notes */}
          {resort.notes && (
            <p className="mt-1 text-[11px] text-muted/70 line-clamp-2">
              {resort.notes}
            </p>
          )}

          {/* Shared bank resorts */}
          {sharedBank.length > 0 && (
            <div className="mt-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Shared day bank
              </span>
              <div className="mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5">
                {sharedBank.map((r) => (
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
                    className="text-[11px] text-ikon hover:underline cursor-pointer"
                  >
                    {r.name}
                    {sharedBank.indexOf(r) < sharedBank.length - 1 ? "," : ""}
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
            Powderhounds
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      </div>
    </button>
  );
}
