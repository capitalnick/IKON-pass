"use client";

import { Resort, Filters, DAY_BANK_GROUPS, MACRO_REGIONS } from "@/types";
import { ResortCard } from "./ResortCard";
import { Mountain } from "lucide-react";

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
    filters.dayBankGroups.length > 0 ||
    filters.passType !== "all" ||
    filters.newOnly ||
    filters.noBlackouts;

  return (
    <aside className="flex h-full w-[380px] min-w-[380px] flex-col border-r border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            <svg width="90" height="40" viewBox="0 0 90 40" xmlns="http://www.w3.org/2000/svg" aria-label="Ikon Pass"><path d="M90 27.624c-.063.008-.125.025-.187.025-2.203 0-4.405 0-6.607.003a.298.298 0 0 1-.273-.137 10488.277 10488.277 0 0 0-11.93-16.162c-.022-.03-.05-.054-.107-.113v16.397H63.95V.89c.065-.003.121-.008.178-.008 2.196 0 4.393 0 6.59-.002.112 0 .192.023.265.121 2.524 3.418 5.051 6.834 7.578 10.25l4.315 5.833c.037.05.078.097.152.187V.882h.213l6.554.001c.069 0 .137.016.205.025v26.716zm0 9.326l-25.794-.001h-.256v-1.754c.063-.003.125-.008.187-.008h25.671c.064 0 .128.006.192.01v1.753zM48.712 40c-.435-.078-.876-.13-1.3-.241-.419-.11-.82-.282-1.25-.433l.856-2.205c.09.066.166.116.236.174.439.363.938.576 1.507.619.23.017.457.011.652-.136.112-.085.211-.204.152-.342-.045-.105-.149-.225-.252-.257-.27-.085-.554-.128-.833-.184-.377-.074-.75-.149-1.088-.354-.711-.433-1.01-1.077-.955-1.889.08-1.178.772-1.917 1.81-2.332 1.156-.462 2.316-.34 3.447.14.466.198.464.203.288.675l-.515 1.375c-.018.048-.04.095-.061.144-.26-.13-.507-.269-.765-.381-.33-.143-.675-.22-1.038-.16-.072.01-.16.03-.207.078-.079.083-.178.193-.179.292 0 .085.11.22.198.247.36.111.73.193 1.097.278.394.092.772.22 1.103.46.575.418.78 1.01.789 1.69.013 1.072-.619 2.014-1.663 2.427-.336.133-.704.188-1.058.278-.055.014-.111.025-.167.037h-.804zm8.46 0c-.389-.066-.786-.104-1.164-.207-.425-.115-.832-.292-1.249-.438-.092-.032-.114-.08-.079-.171.261-.667.52-1.335.78-2.002.005-.016.018-.029.038-.056.099.077.188.15.28.217.535.398 1.121.637 1.802.554.1-.012.217-.05.284-.117.083-.083.18-.218.166-.315-.015-.107-.133-.242-.238-.283-.208-.081-.44-.1-.66-.155-.37-.093-.765-.14-1.104-.303-.904-.434-1.285-1.27-1.09-2.287.196-1.02.856-1.657 1.776-2.02 1.146-.45 2.293-.34 3.415.13.504.212.502.212.306.724-.177.462-.349.926-.524 1.39-.012.031-.028.061-.042.09-.275-.136-.538-.282-.813-.398-.326-.137-.668-.208-1.023-.13a.556.556 0 0 0-.232.11c-.2.167-.176.4.067.497.214.084.447.122.67.183.365.098.743.163 1.09.305.882.36 1.327 1.155 1.236 2.155-.107 1.177-.802 1.891-1.857 2.287-.327.124-.686.163-1.03.24h-.805zm4.1-25.73c0 7.88-6.37 14.264-14.23 14.262-7.906-.001-14.254-6.384-14.225-14.35C32.845 6.337 39.197-.011 47.053 0c7.87.011 14.22 6.385 14.22 14.27zm-41.419 4.488c-.586.7-1.137 1.404-1.738 2.06-.31.34-.396.69-.392 1.133.02 1.823.009 3.646.009 5.469v.218h-6.946V.893h6.943v10.994l.045.017c.151-.194.304-.387.453-.582l6.525-8.593c.441-.58.88-1.161 1.328-1.736a.309.309 0 0 1 .213-.106c2.773-.005 5.546-.005 8.32-.004.044 0 .087.008.164.016-.186.229-.353.435-.522.64l-5.507 6.68c-1.466 1.778-2.931 3.555-4.4 5.329-.065.079-.068.126-.001.206A28217.899 28217.899 0 0 1 35.6 27.464c.039.048.073.1.137.186h-.226c-2.867 0-5.733 0-8.6.003a.34.34 0 0 1-.305-.149 3844.226 3844.226 0 0 0-6.661-8.642c-.024-.032-.053-.06-.092-.104zM.001 27.638V.894h6.933v26.746H.001zM0 36.936v-1.736h24.52v1.736H0zm44.098 2.954h-.187c-.856 0-1.713-.005-2.57.004-.15.002-.2-.054-.23-.186-.046-.21-.114-.416-.162-.626-.023-.106-.07-.143-.178-.142-.6.004-1.2.005-1.8 0-.108-.002-.14.042-.158.136-.052.268-.113.535-.17.806h-2.93c.01-.054.014-.105.03-.15.833-2.412 1.669-4.823 2.496-7.236.062-.184.138-.249.338-.246.885.014 1.77.009 2.657.003.125 0 .18.038.222.157.864 2.438 1.732 4.874 2.6 7.31.016.049.025.1.042.17zm-16.312-.01v-7.611c.053-.005.102-.012.152-.012 1.17-.001 2.341-.004 3.512 0 .631.003 1.238.112 1.782.46.782.502 1.163 1.232 1.21 2.148.03.569-.048 1.122-.352 1.616-.451.735-1.12 1.097-1.977 1.11-.472.007-.944.004-1.415.006h-.207v2.282h-2.705zm2.708-5.532c0 .43-.002.82.003 1.208 0 .033.045.094.07.094.295.006.6.047.865-.123a.61.61 0 0 0 .295-.626c-.03-.244-.148-.43-.392-.475-.27-.049-.548-.053-.841-.078zm9.927 2.748l-.522-2.266-.52 2.266h1.042zM55.01 16.357c.646-2.488-.045-5.941-2.805-8.195a8.172 8.172 0 0 0-9.928-.303c-2.927 2.11-3.97 5.723-3.163 8.703l2.888-3.017 1.342 1.253 3.905-4.5 4.197 5.036 1.51-1.399 2.054 2.422z" fill="#F6CA30" fillRule="evenodd"/></svg>
          </h1>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Mountain className="h-3 w-3" />
            {resorts.length} / {totalCount} resorts
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

        {/* Day Bank */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Shared Day Bank
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DAY_BANK_GROUPS).map(([key, group]) => (
              <button
                key={key}
                onClick={() =>
                  toggleArrayItem(filters.dayBankGroups, key, "dayBankGroups")
                }
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.dayBankGroups.includes(key)
                    ? "bg-ikon text-white"
                    : "bg-background text-muted hover:text-foreground border border-border"
                }`}
              >
                <span>{group.label}</span>
                <span className={`ml-1.5 text-[10px] ${filters.dayBankGroups.includes(key) ? "text-white/70" : "text-muted/60"}`}>
                  {group.resortCount}
                </span>
              </button>
            ))}
          </div>
          {filters.dayBankGroups.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {filters.dayBankGroups.map((key) => {
                const g = DAY_BANK_GROUPS[key];
                return (
                  <p key={key} className="text-[10px] text-muted">
                    <span className="text-foreground/70">{g.label}:</span>{" "}
                    {g.fullDays} Full Pass
                    {g.baseDays !== "N/A" ? ` · ${g.baseDays} Base Pass` : " · Not on Base Pass"}
                    {" "}across {g.resortCount} resorts
                  </p>
                );
              })}
            </div>
          )}
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

          <div className="flex gap-2">
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
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Blackouts
              </label>
              <button
                onClick={() => update({ noBlackouts: !filters.noBlackouts })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filters.noBlackouts
                    ? "bg-ikon text-white"
                    : "bg-background text-muted border border-border hover:text-foreground"
                }`}
              >
                No Blackouts
              </button>
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                macroRegions: [],
                dayBankGroups: [],
                passType: "all",
                newOnly: false,
                noBlackouts: false,
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
      <div className="flex-1 overflow-y-auto py-1">
        {resorts.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted">
            No resorts match your filters
          </div>
        ) : (
          <div className="resort-list">
            {resorts.map((resort) => (
              <ResortCard
                key={resort.id}
                resort={resort}
                isSelected={selectedResort?.id === resort.id}
                onClick={() => onResortClick(resort)}
                onNavigate={onResortClick}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
