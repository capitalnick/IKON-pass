"use client";

import { useState, useMemo, useCallback } from "react";
import { resorts } from "@/data/resorts";
import { Filters, Resort } from "@/types";
import { Sidebar } from "./Sidebar";
import { FeltMap } from "./FeltMap";
import { ResortDetailPanel } from "./ResortDetailPanel";

const defaultFilters: Filters = {
  macroRegions: [],
  colorGroups: [],
  passType: "all",
  newOnly: false,
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

    if (filters.colorGroups.length > 0) {
      if (!filters.colorGroups.includes(r.colorGroup)) return false;
    }

    if (filters.newOnly && !r.isNew) return false;

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
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedResort, setSelectedResort] = useState<Resort | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filtered = useMemo(() => applyFilters(resorts, filters), [filters]);

  // Sidebar click — no anchor point
  const handleResortClick = useCallback((resort: Resort) => {
    setSelectedResort(resort);
    setAnchorPoint(null);
  }, []);

  // Map marker click — includes pixel position
  const handleMapResortSelect = useCallback((resort: Resort, point: { x: number; y: number }) => {
    setSelectedResort(resort);
    setAnchorPoint(point);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
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

      {/* Map area */}
      <div className="relative flex-1">
        {/* Toggle sidebar button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors"
            aria-label="Open sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}

        <FeltMap filters={filters} selectedResort={selectedResort} onResortSelect={handleMapResortSelect} />

        {/* Resort detail panel overlay */}
        {selectedResort && (
          <ResortDetailPanel
            resort={selectedResort}
            anchorPoint={anchorPoint}
            onClose={() => { setSelectedResort(null); setAnchorPoint(null); }}
            onNavigate={(r) => { setSelectedResort(r); setAnchorPoint(null); }}
          />
        )}
      </div>
    </div>
  );
}
