"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Resort, COLOR_MAP } from "@/types";
import { resorts as allResorts } from "@/data/resorts";
import { powderhoundsData } from "@/data/powderhounds";
import { wikiThumb } from "@/lib/wikiThumb";
import { lngLatToPixel, type Viewport } from "@/lib/geoProject";
import {
  TripEntry,
  PassType,
  getResortAllowance,
  isAvailableOnPass,
} from "@/lib/tripUtils";
import {
  Mountain,
  MapPin,
  CalendarDays,
  Snowflake,
  Users,
  ExternalLink,
  X,
  ShieldCheck,
  CalendarOff,
  Ticket,
  CheckCircle,
  ChevronDown,
  Plus,
  Minus,
  AlertTriangle,
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

/* ── Stat cell ─────────────────────────────────────────── */

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

/* ── Info tab types ────────────────────────────────────── */

type InfoTab = "overview" | "pros-cons" | "terrain" | "snow";

const TABS: { id: InfoTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pros-cons", label: "Pros & Cons" },
  { id: "terrain", label: "Terrain" },
  { id: "snow", label: "Snow History" },
];

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

/* ── Positioning logic ───────────────────────────────────── */

const PANEL_W = 460;
const EDGE_PAD = 8;
const MARKER_GAP = 16;
const TRIANGLE_DEFAULT = 30;

interface PanelPosition {
  top: number;
  left: number;
  triangleLeft: number;
}

function computePosition(
  markerPixel: { x: number; y: number },
  containerW: number,
): PanelPosition {
  let left = markerPixel.x - TRIANGLE_DEFAULT;
  let triangleLeft = TRIANGLE_DEFAULT;

  // Clamp right edge
  if (left + PANEL_W > containerW - EDGE_PAD) {
    const overflow = left + PANEL_W - (containerW - EDGE_PAD);
    left -= overflow;
    triangleLeft += overflow;
  }

  // Clamp left edge
  if (left < EDGE_PAD) {
    triangleLeft -= EDGE_PAD - left;
    left = EDGE_PAD;
  }

  // Clamp triangle within panel bounds
  triangleLeft = Math.max(16, Math.min(triangleLeft, PANEL_W - 16));

  const top = markerPixel.y + MARKER_GAP;

  return { top, left, triangleLeft };
}

/* ── Resort Detail Panel ─────────────────────────────────── */

interface ResortDetailPanelProps {
  resort: Resort;
  viewport: Viewport | null;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onNavigate: (resort: Resort) => void;
  trip: TripEntry[];
  passType: PassType;
  onAddToTrip: (resortId: string, days: number) => void;
  onRemoveFromTrip: (resortId: string) => void;
}

export function ResortDetailPanel({
  resort,
  viewport,
  mapContainerRef,
  onClose,
  onNavigate,
  trip,
  passType,
  onAddToTrip,
  onRemoveFromTrip,
}: ResortDetailPanelProps) {
  const color = COLOR_MAP[resort.colorGroup] ?? "#666";
  const sharedBank = getSharedBankResorts(resort);
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InfoTab>("overview");

  const phData = powderhoundsData[resort.id] ?? null;
  const phUrl = resort.powderhoundsUrl;

  // Trip controls
  const existingEntry = trip.find((e) => e.resortId === resort.id);
  const [tripDays, setTripDays] = useState(existingEntry?.days ?? 1);
  const allowance = getResortAllowance(resort, passType);
  const available = isAvailableOnPass(resort, passType);
  const isSharedBank = !!resort.dayBankGroup;

  // Days already booked in the same shared bank (excluding this resort)
  const bankDaysElsewhere = isSharedBank
    ? trip
        .filter((e) => {
          const r = allResorts.find((x) => x.id === e.resortId);
          return r && r.dayBankGroup === resort.dayBankGroup && e.resortId !== resort.id;
        })
        .reduce((sum, e) => sum + e.days, 0)
    : 0;

  const maxDays =
    allowance === Infinity ? 99 : Math.max(1, allowance - bankDaysElsewhere);
  const effectiveDays = Math.min(tripDays, allowance === Infinity ? tripDays : maxDays);

  // Reset image error state and sync trip days when resort changes
  useEffect(() => {
    setImgError(false);
    const entry = trip.find((e) => e.resortId === resort.id);
    setTripDays(entry?.days ?? 1);
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

  // Reproject resort lat/lng → screen pixels on every viewport change
  let position: PanelPosition | null = null;
  if (viewport && mapContainerRef.current) {
    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const pixel = lngLatToPixel(
        resort.longitude,
        resort.latitude,
        viewport,
        rect.width,
        rect.height,
      );
      position = computePosition(pixel, rect.width);
    }
  }

  const hasAnchor = position != null;

  return (
    <div
      role="dialog"
      aria-labelledby="resort-detail-name"
      className={`
        absolute z-20
        ${hasAnchor ? "w-[460px]" : "w-full md:w-[460px] bottom-0 md:bottom-4 left-0 md:left-4"}
        transition-opacity duration-200 ease-out
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
      style={
        position
          ? { top: position.top, left: position.left }
          : undefined
      }
    >
      {/* Upward-pointing triangle connector to map marker */}
      {position && (
        <div
          className="hidden md:block absolute -top-2 w-4 h-4 rotate-45 border-l border-t border-border bg-surface z-10"
          style={{ left: position.triangleLeft }}
        />
      )}

      {/* Card body */}
      <div className="rounded-t-xl md:rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 max-h-[70vh] overflow-y-auto relative">
        {/* Hero image section */}
        <div className="relative h-44 overflow-hidden rounded-t-xl bg-surface">
          {resort.imageUrl && !imgError ? (
            <img
              src={wikiThumb(resort.imageUrl, 800)}
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

          {/* Access restrictions */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Access
            </div>
            <div className="flex flex-wrap gap-2">
              {resort.reservationRequired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  <Ticket className="h-3 w-3" />
                  Reservation required
                </span>
              )}
              {resort.fullPassOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400">
                  <ShieldCheck className="h-3 w-3" />
                  Full Pass only
                </span>
              )}
              {resort.blackoutDates && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400">
                  <CalendarOff className="h-3 w-3" />
                  Blackouts: {resort.blackoutDates}
                </span>
              )}
              {!resort.reservationRequired && !resort.fullPassOnly && !resort.blackoutDates && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  No restrictions
                </span>
              )}
            </div>
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

          {/* Add to Trip */}
          <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              Add to Trip
              <span className="text-[10px] text-muted/60 ml-auto">
                {passType === "full" ? "Full" : "Base"} Pass
              </span>
            </div>

            {!available ? (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Not available on the {passType === "full" ? "Full" : "Base"} Pass
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Day stepper */}
                <div className="flex items-center gap-1 bg-surface rounded-lg border border-border px-1 py-1">
                  <button
                    onClick={() => setTripDays((d) => Math.max(1, d - 1))}
                    disabled={tripDays <= 1}
                    className="h-7 w-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-foreground tabular-nums">
                    {effectiveDays}
                  </span>
                  <button
                    onClick={() =>
                      setTripDays((d) =>
                        allowance === Infinity ? d + 1 : Math.min(maxDays, d + 1)
                      )
                    }
                    disabled={allowance !== Infinity && effectiveDays >= maxDays}
                    className="h-7 w-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-xs text-muted">
                  day{effectiveDays !== 1 ? "s" : ""}
                  {allowance !== Infinity && (
                    <span className="ml-1 text-muted/60">/ {allowance}</span>
                  )}
                </span>

                <div className="ml-auto flex gap-2">
                  {existingEntry ? (
                    <>
                      <button
                        onClick={() => onRemoveFromTrip(resort.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => onAddToTrip(resort.id, effectiveDays)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-ikon text-white hover:bg-ikon/90 transition-colors"
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onAddToTrip(resort.id, effectiveDays)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-ikon text-white hover:bg-ikon/90 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  )}
                </div>
              </div>
            )}

            {isSharedBank && bankDaysElsewhere > 0 && (
              <p className="mt-2 text-[10px] text-amber-400">
                {bankDaysElsewhere}d already booked in {resort.dayBankGroup} bank
              </p>
            )}
          </div>

          {/* Resort Info accordion */}
          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="mt-4 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            <span>Resort Info</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                infoOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${
              infoOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {infoOpen && (
              <div className="mt-2 rounded-lg border border-border bg-background/50 p-3">
                {/* Tab navigation */}
                <div className="flex gap-1 mb-3">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors ${
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
                    <>
                      {phData?.description ? (
                        <p className="text-[12px] text-muted/90 leading-relaxed whitespace-pre-line">
                          {phData.description}
                        </p>
                      ) : phUrl ? (
                        <a
                          href={phUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-ikon hover:underline inline-flex items-center gap-1"
                        >
                          Full resort review available on Powderhounds
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-[12px] text-muted/50 italic">
                          No resort overview available yet.
                        </p>
                      )}
                    </>
                  )}

                  {activeTab === "pros-cons" && (
                    <>
                      {phData && (phData.pros.length > 0 || phData.cons.length > 0) ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
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
                      ) : phUrl ? (
                        <a
                          href={phUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-ikon hover:underline inline-flex items-center gap-1"
                        >
                          See full review on Powderhounds for pros &amp; cons
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-[12px] text-muted/50 italic">
                          No pros &amp; cons data available.
                        </p>
                      )}
                    </>
                  )}

                  {activeTab === "terrain" && (
                    <>
                      {phData?.terrainStats && (phData.terrainStats.runs || phData.terrainStats.beginner || phData.terrainStats.vertical || phData.terrainStats.lifts) ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <StatCell label="Runs" value={phData.terrainStats.runs} />
                            <StatCell label="Longest Run" value={phData.terrainStats.longestRun} />
                            <StatCell label="Season" value={phData.terrainStats.season} />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <StatCell label="Beginner" value={phData.terrainStats.beginner} />
                            <StatCell label="Intermediate" value={phData.terrainStats.intermediate} />
                            <StatCell label="Advanced" value={phData.terrainStats.advanced} />
                          </div>
                          {(phData.terrainStats.vertical || phData.terrainStats.lifts || phData.terrainStats.snowfall) && (
                            <div className="grid grid-cols-3 gap-3">
                              <StatCell label="Vertical" value={phData.terrainStats.vertical} />
                              <StatCell label="Lifts" value={phData.terrainStats.lifts} />
                              <StatCell label="Snowfall" value={phData.terrainStats.snowfall} />
                            </div>
                          )}
                        </div>
                      ) : phUrl ? (
                        <a
                          href={phUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-ikon hover:underline inline-flex items-center gap-1"
                        >
                          See terrain stats on Powderhounds
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-[12px] text-muted/50 italic">
                          No terrain data available.
                        </p>
                      )}
                    </>
                  )}

                  {activeTab === "snow" && (
                    <p className="text-[12px] text-muted/50 italic">Coming soon</p>
                  )}
                </div>

                {/* Footer link */}
                {phUrl && (
                  <a
                    href={phUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-[11px] font-medium text-ikon hover:bg-surface-hover transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View full review on Powderhounds
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
