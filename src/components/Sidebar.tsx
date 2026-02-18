"use client";

import { Resort, Filters, COLOR_MAP, MACRO_REGIONS } from "@/types";
import { ResortCard } from "./ResortCard";

const colorGroups = Object.keys(COLOR_MAP);

interface SidebarProps {
  resorts: Resort[];
  totalCount: number;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  selectedResort: Resort | null;
  onResortClick: (resort: Resort) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function Sidebar({
  resorts,
  totalCount,
  filters,
  onFiltersChange,
  selectedResort,
  onResortClick,
  onClose,
  isOpen,
}: SidebarProps) {
  if (!isOpen) return null;

  const update = (partial: Partial<Filters>) =>
    onFiltersChange({ ...filters, ...partial });

  const toggleArrayItem = (
    arr: string[],
    item: string,
    key: keyof Filters
  ) => {
    const next = arr.includes(item)
      ? arr.filter((x) => x !== item)
      : [...arr, item];
    update({ [key]: next });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.macroRegions.length > 0 ||
    filters.colorGroups.length > 0 ||
    filters.passType !== "all" ||
    filters.newOnly;

  return (
    <aside className="flex h-full w-[380px] min-w-[380px] flex-col border-r border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Ikon Pass 25/26
          </h1>
          <p className="text-xs text-muted">
            {resorts.length} of {totalCount} resorts
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-hover transition-colors"
          aria-label="Close sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pt-4 pb-2">
        <input
          type="text"
          placeholder="Search resorts, countries..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-ikon focus:outline-none transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3 px-5 py-3 border-b border-border">
        {/* Macro Region */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Region
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MACRO_REGIONS.map((region) => (
              <button
                key={region}
                onClick={() =>
                  toggleArrayItem(
                    filters.macroRegions,
                    region,
                    "macroRegions"
                  )
                }
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.macroRegions.includes(region)
                    ? "bg-ikon text-white"
                    : "bg-background text-muted hover:text-foreground border border-border"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Color Group */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Color Group
          </label>
          <div className="flex flex-wrap gap-1.5">
            {colorGroups.map((group) => (
              <button
                key={group}
                onClick={() =>
                  toggleArrayItem(
                    filters.colorGroups,
                    group,
                    "colorGroups"
                  )
                }
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                  filters.colorGroups.includes(group)
                    ? "ring-1 ring-foreground bg-background text-foreground"
                    : "bg-background text-muted hover:text-foreground border border-border"
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLOR_MAP[group] }}
                />
                <span className="truncate max-w-[120px]">{group}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pass Type + New Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Pass Type
            </label>
            <select
              value={filters.passType}
              onChange={(e) =>
                update({
                  passType: e.target.value as Filters["passType"],
                })
              }
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-ikon focus:outline-none"
            >
              <option value="all">All Passes</option>
              <option value="full-only">Full Pass Only</option>
              <option value="base-included">On Base Pass</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              New 25/26
            </label>
            <button
              onClick={() => update({ newOnly: !filters.newOnly })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.newOnly
                  ? "bg-ikon text-white"
                  : "bg-background text-muted border border-border hover:text-foreground"
              }`}
            >
              New Only
            </button>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                macroRegions: [],
                colorGroups: [],
                passType: "all",
                newOnly: false,
                search: "",
              })
            }
            className="text-xs text-ikon hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Resort List */}
      <div className="flex-1 overflow-y-auto">
        {resorts.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted">
            No resorts match your filters
          </div>
        ) : (
          <div className="divide-y divide-border">
            {resorts.map((resort) => (
              <ResortCard
                key={resort.id}
                resort={resort}
                isSelected={selectedResort?.id === resort.id}
                onClick={() => onResortClick(resort)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
