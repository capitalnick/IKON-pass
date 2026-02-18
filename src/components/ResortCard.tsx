"use client";

import { Resort, COLOR_MAP } from "@/types";

interface ResortCardProps {
  resort: Resort;
  isSelected: boolean;
  onClick: () => void;
}

export function ResortCard({ resort, isSelected, onClick }: ResortCardProps) {
  const color = COLOR_MAP[resort.colorGroup] ?? "#666";

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
          {/* Name + New badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {resort.name}
            </span>
            {resort.isNew && (
              <span className="flex-shrink-0 rounded bg-ikon/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ikon">
                New
              </span>
            )}
          </div>

          {/* Country + Group */}
          <div className="mt-0.5 text-xs text-muted">
            {resort.country}
            {resort.group !== "Individual" && (
              <span className="text-muted/60"> · {resort.group}</span>
            )}
          </div>

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
        </div>
      </div>
    </button>
  );
}
