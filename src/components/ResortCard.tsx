"use client";

import { useState } from "react";
import { Resort, COLOR_MAP } from "@/types";
import { resorts as allResorts } from "@/data/resorts";
import { powderhoundsData } from "@/data/powderhounds";
import { wikiThumb } from "@/lib/wikiThumb";
import {
  Mountain,
  MapPin,
  CalendarDays,
  Snowflake,
  Users,
  ExternalLink,
  ShieldCheck,
  CalendarOff,
  Ticket,
  CheckCircle,
  ChevronDown,
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

/* ── Terrain stat cell ────────────────────────────────────── */
function StatCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="text-[13px] font-semibold text-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

/* ── Tab types ────────────────────────────────────────────── */
type InfoTab = "overview" | "pros-cons" | "terrain" | "snow";

const TABS: { id: InfoTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pros-cons", label: "Pros & Cons" },
  { id: "terrain", label: "Terrain" },
  { id: "snow", label: "Snow History" },
];

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
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InfoTab>("overview");

  const phData = powderhoundsData[resort.id] ?? null;
  const phUrl = resort.powderhoundsUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-full text-left px-4 py-3 transition-colors border-l-[3px] hover:bg-surface-hover cursor-pointer ${
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

          {/* Access restrictions */}
          {(resort.reservationRequired || resort.fullPassOnly || resort.blackoutDates) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {resort.reservationRequired && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                  <Ticket className="h-2.5 w-2.5" />
                  Reservation
                </span>
              )}
              {resort.fullPassOnly && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Full Pass Only
                </span>
              )}
              {resort.blackoutDates && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
                  <CalendarOff className="h-2.5 w-2.5" />
                  Blackouts
                </span>
              )}
            </div>
          )}
          {!resort.reservationRequired && !resort.fullPassOnly && !resort.blackoutDates && (
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                <CheckCircle className="h-2.5 w-2.5" />
                No restrictions
              </span>
            </div>
          )}

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

        </div>
      </div>

      {/* Resort Info accordion toggle — full width below thumbnail row */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setInfoOpen(!infoOpen);
        }}
        className="mt-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
      >
        <span>Resort Info</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${
            infoOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Accordion content — full width */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          infoOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {infoOpen && (
          <div
            className="mt-2 rounded-lg border border-border bg-background/50 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tab navigation */}
            <div className="flex gap-1 mb-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? "bg-ikon/20 text-ikon"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[80px]">
              {activeTab === "overview" && (
                <OverviewTab phData={phData} phUrl={phUrl} />
              )}
              {activeTab === "pros-cons" && (
                <ProsConsTab phData={phData} phUrl={phUrl} />
              )}
              {activeTab === "terrain" && (
                <TerrainTab phData={phData} phUrl={phUrl} />
              )}
              {activeTab === "snow" && <SnowTab />}
            </div>

            {/* Footer link */}
            {phUrl && (
              <a
                href={phUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-[11px] font-medium text-ikon hover:bg-surface-hover transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View full review
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tab: Overview ────────────────────────────────────────── */

function OverviewTab({
  phData,
  phUrl,
}: {
  phData: (typeof powderhoundsData)[string] | null;
  phUrl: string | null;
}) {
  if (phData?.description) {
    return (
      <p className="text-[12px] text-muted/90 leading-relaxed whitespace-pre-line">
        {phData.description}
      </p>
    );
  }

  if (phUrl) {
    return (
      <a
        href={phUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[12px] text-ikon hover:underline inline-flex items-center gap-1"
      >
        Full resort review available on Powderhounds
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <p className="text-[12px] text-muted/50 italic">
      No resort overview available yet.
    </p>
  );
}

/* ── Tab: Pros & Cons ─────────────────────────────────────── */

function ProsConsTab({
  phData,
  phUrl,
}: {
  phData: (typeof powderhoundsData)[string] | null;
  phUrl: string | null;
}) {
  if (!phData || (!phData.pros.length && !phData.cons.length)) {
    if (phUrl) {
      return (
        <a
          href={phUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] text-ikon hover:underline inline-flex items-center gap-1"
        >
          See full review on Powderhounds for pros &amp; cons
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return (
      <p className="text-[12px] text-muted/50 italic">
        No pros &amp; cons data available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Pros */}
        {phData.pros.length > 0 && (
          <div className="border-l-2 border-emerald-500/40 pl-2 space-y-1">
            {phData.pros.map((item, i) => (
              <div key={i} className="text-[11px] text-emerald-400 leading-snug">
                <span className="mr-1">&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Cons */}
        {phData.cons.length > 0 && (
          <div className="border-l-2 border-rose-500/40 pl-2 space-y-1">
            {phData.cons.map((item, i) => (
              <div key={i} className="text-[11px] text-rose-400 leading-snug">
                <span className="mr-1">&#10007;</span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro or Con */}
      {phData.proOrCon.length > 0 && (
        <div className="border-l-2 border-amber-500/40 pl-2 space-y-1">
          {phData.proOrCon.map((item, i) => (
            <div key={i} className="text-[11px] text-amber-400 leading-snug">
              <span className="mr-1">&hArr;</span>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tab: Terrain ─────────────────────────────────────────── */

function TerrainTab({
  phData,
  phUrl,
}: {
  phData: (typeof powderhoundsData)[string] | null;
  phUrl: string | null;
}) {
  const ts = phData?.terrainStats;

  if (!ts || (!ts.runs && !ts.beginner && !ts.vertical && !ts.lifts)) {
    if (phUrl) {
      return (
        <a
          href={phUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] text-ikon hover:underline inline-flex items-center gap-1"
        >
          See terrain stats on Powderhounds
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return (
      <p className="text-[12px] text-muted/50 italic">
        No terrain data available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Runs" value={ts.runs} />
        <StatCell label="Longest Run" value={ts.longestRun} />
        <StatCell label="Season" value={ts.season} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Beginner" value={ts.beginner} />
        <StatCell label="Intermediate" value={ts.intermediate} />
        <StatCell label="Advanced" value={ts.advanced} />
      </div>
      {(ts.vertical || ts.lifts || ts.snowfall) && (
        <div className="grid grid-cols-3 gap-3">
          <StatCell label="Vertical" value={ts.vertical} />
          <StatCell label="Lifts" value={ts.lifts} />
          <StatCell label="Snowfall" value={ts.snowfall} />
        </div>
      )}
    </div>
  );
}

/* ── Tab: Snow History (placeholder) ──────────────────────── */

function SnowTab() {
  return (
    <p className="text-[12px] text-muted/50 italic">Coming soon</p>
  );
}
