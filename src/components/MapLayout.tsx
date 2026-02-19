"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { resorts } from "@/data/resorts";
import { Filters, Resort } from "@/types";
import { Sidebar } from "./Sidebar";
import { FeltMap } from "./FeltMap";
import { ResortDetailPanel } from "./ResortDetailPanel";
import { TripPlanner } from "./TripPlanner";
import { BottomSheet } from "./BottomSheet";
import { TripEntry, PassType, computeTripSummary } from "@/lib/tripUtils";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Viewport } from "@/lib/geoProject";

const defaultFilters: Filters = {
  macroRegions: [],
  dayBankGroups: [],
  passType: "all",
  newOnly: false,
  noBlackouts: false,
  search: "",
};

function applyFilters(allResorts: Resort[], filters: Filters): Resort[] {
  return allResorts.filter((r) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        r.name.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.colorGroup.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.macroRegions.length > 0) {
      if (!filters.macroRegions.includes(r.macroRegion)) return false;
    }

    if (filters.dayBankGroups.length > 0) {
      const includesIndividual = filters.dayBankGroups.includes("Individual");
      const bankFilters = filters.dayBankGroups.filter((g) => g !== "Individual");
      const inBank = r.dayBankGroup && bankFilters.includes(r.dayBankGroup);
      const isIndividual = !r.dayBankGroup && includesIndividual;
      if (!inBank && !isIndividual) return false;
    }

    if (filters.newOnly && !r.isNew) return false;

    if (filters.noBlackouts && r.blackoutDates) return false;

    if (filters.passType === "full-only") {
      if (r.fullPassDays === "N/A") return false;
    }
    if (filters.passType === "base-included") {
      if (r.basePassDays === "N/A") return false;
    }

    return true;
  });
}

export function MapLayout() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedResort, setSelectedResort] = useState<Resort | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTripOpen, setMobileTripOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Trip state — all in-memory, purged on refresh
  const [trip, setTrip] = useState<TripEntry[]>([]);
  const [passType, setPassType] = useState<PassType>("full");

  const filtered = useMemo(() => applyFilters(resorts, filters), [filters]);

  const handleResortClick = useCallback((resort: Resort) => {
    setSelectedResort(resort);
    setMobileSidebarOpen(false);
  }, []);

  const handleAddToTrip = useCallback((resortId: string, days: number) => {
    setTrip((prev) => {
      const exists = prev.find((e) => e.resortId === resortId);
      if (exists) {
        return prev.map((e) => (e.resortId === resortId ? { ...e, days } : e));
      }
      return [...prev, { resortId, days }];
    });
  }, []);

  const handleRemoveFromTrip = useCallback((resortId: string) => {
    setTrip((prev) => prev.filter((e) => e.resortId !== resortId));
  }, []);

  const handleSelectResortById = useCallback((resortId: string) => {
    const resort = resorts.find((r) => r.id === resortId);
    if (resort) {
      setSelectedResort(resort);
      setMobileTripOpen(false);
    }
  }, []);

  const tripSummary = useMemo(
    () => computeTripSummary(trip, passType),
    [trip, passType],
  );

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      {mounted && !isMobile && (
        <Sidebar
          resorts={filtered}
          totalCount={resorts.length}
          filters={filters}
          onFiltersChange={setFilters}
          selectedResort={selectedResort}
          onResortClick={handleResortClick}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
        />
      )}

      {/* ── MAP AREA ── */}
      <div className="relative flex-1">

        {/* Desktop: toggle sidebar button (when closed) */}
        {mounted && !isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors"
            aria-label="Open sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}

        {/* Desktop: Trip Planner top-right */}
        {mounted && !isMobile && (
          <TripPlanner
            trip={trip}
            passType={passType}
            onPassTypeChange={setPassType}
            onClearTrip={() => setTrip([])}
            onSelectResort={handleSelectResortById}
          />
        )}

        {/* Map */}
        {mounted && (
          <FeltMap
            filters={filters}
            filteredResorts={filtered}
            selectedResort={selectedResort}
            onResortSelect={handleResortClick}
            onViewportChange={setViewport}
            mapContainerRef={mapContainerRef}
            isMobile={isMobile}
          />
        )}

        {/* Desktop: Resort detail panel overlay */}
        {mounted && !isMobile && selectedResort && (
          <ResortDetailPanel
            resort={selectedResort}
            viewport={viewport}
            mapContainerRef={mapContainerRef}
            onClose={() => setSelectedResort(null)}
            onNavigate={(r) => setSelectedResort(r)}
            trip={trip}
            passType={passType}
            onAddToTrip={handleAddToTrip}
            onRemoveFromTrip={handleRemoveFromTrip}
          />
        )}

        {/* ── MOBILE FABs ── */}
        {mounted && isMobile && (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between px-4 pointer-events-none"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
          >
            {/* Left FAB: open resort list */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface border border-border shadow-lg px-4 h-12 text-sm font-semibold text-foreground active:scale-95 transition-transform"
              aria-label="Open resort list"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              <span>Resorts</span>
              <span className="rounded-full bg-border px-1.5 py-0.5 text-xs text-muted">
                {filtered.length}
              </span>
            </button>

            {/* Right FAB: open trip planner */}
            <button
              onClick={() => setMobileTripOpen(true)}
              className={`pointer-events-auto flex items-center gap-2 rounded-full shadow-lg px-4 h-12 text-sm font-semibold active:scale-95 transition-transform border ${
                tripSummary.hasAnyExceeded
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : trip.length > 0
                    ? "bg-ikon text-white border-transparent"
                    : "bg-surface border-border text-foreground"
              }`}
              aria-label="Open trip planner"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>My Trip</span>
              {trip.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  tripSummary.hasAnyExceeded ? "bg-red-500/30 text-red-300" : "bg-white/20 text-white"
                }`}>
                  {tripSummary.totalDays}d
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE: Resort detail as bottom sheet ── */}
      {mounted && isMobile && (
        <BottomSheet
          isOpen={selectedResort !== null}
          onClose={() => setSelectedResort(null)}
          maxHeightClass="max-h-[60vh]"
        >
          {selectedResort && (
            <ResortDetailPanel
              resort={selectedResort}
              viewport={viewport}
              mapContainerRef={mapContainerRef}
              onClose={() => setSelectedResort(null)}
              onNavigate={(r) => setSelectedResort(r)}
              trip={trip}
              passType={passType}
              onAddToTrip={handleAddToTrip}
              onRemoveFromTrip={handleRemoveFromTrip}
              mobileSheet
            />
          )}
        </BottomSheet>
      )}

      {/* ── MOBILE: Sidebar bottom sheet ── */}
      {mounted && isMobile && (
        <BottomSheet
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          maxHeightClass="max-h-[90vh]"
        >
          <Sidebar
            resorts={filtered}
            totalCount={resorts.length}
            filters={filters}
            onFiltersChange={setFilters}
            selectedResort={selectedResort}
            onResortClick={handleResortClick}
            onClose={() => setMobileSidebarOpen(false)}
            isOpen={true}
            mobileSheet
          />
        </BottomSheet>
      )}

      {/* ── MOBILE: Trip Planner bottom sheet ── */}
      {mounted && isMobile && (
        <BottomSheet
          isOpen={mobileTripOpen}
          onClose={() => setMobileTripOpen(false)}
          maxHeightClass="max-h-[85vh]"
          title="My Trip"
        >
          <TripPlanner
            trip={trip}
            passType={passType}
            onPassTypeChange={setPassType}
            onClearTrip={() => { setTrip([]); setMobileTripOpen(false); }}
            onSelectResort={handleSelectResortById}
            mobileSheet
          />
        </BottomSheet>
      )}
    </div>
  );
}
