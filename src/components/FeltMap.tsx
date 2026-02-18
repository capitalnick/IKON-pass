"use client";

import { useEffect, useRef, useState } from "react";
import { Resort, Filters } from "@/types";

const FELT_MAP_ID = process.env.NEXT_PUBLIC_FELT_MAP_ID;
const FELT_LAYER_ID = process.env.NEXT_PUBLIC_FELT_LAYER_ID;

/* ── Felt filter expression types ─────────────────────────── */
type FeltFilterExpr =
  | [string, "in" | "ni", (string | number | boolean | null)[]]
  | [
      string,
      | "lt"
      | "gt"
      | "le"
      | "ge"
      | "eq"
      | "ne"
      | "cn"
      | "nc"
      | "is"
      | "isnt",
      string | number | boolean | null,
    ];

type FeltFilter =
  | FeltFilterExpr
  | [FeltFilter, "and" | "or", FeltFilter]
  | null;

/* ── Minimal Felt SDK controller type ─────────────────────── */
interface FeltController {
  setViewport(opts: {
    center: { latitude: number; longitude: number };
    zoom: number;
  }): Promise<void>;
  setLayerFilters(params: {
    layerId: string;
    filters: FeltFilter;
    note?: string;
  }): Promise<void>;
  getFeatures(params: {
    layerId: string;
    limit?: number;
  }): Promise<{
    features: Array<{
      id: string | number;
      properties: Record<string, unknown>;
    }>;
  }>;
  selectFeature(params: {
    id: string | number;
    layerId: string;
    showPopup?: boolean;
    fitViewport?: boolean | { maxZoom: number };
  }): Promise<void>;
}

/* ── Props ────────────────────────────────────────────────── */
interface FeltMapProps {
  filters: Filters;
  selectedResort: Resort | null;
}

/* ── Build Felt-compatible filter from sidebar state ──────── */
function buildFeltFilter(filters: Filters): FeltFilter {
  const conditions: FeltFilterExpr[] = [];

  if (filters.macroRegions.length > 0) {
    conditions.push(["macro_region", "in", filters.macroRegions]);
  }

  if (filters.colorGroups.length > 0) {
    conditions.push(["ikon_group", "in", filters.colorGroups]);
  }

  if (filters.newOnly) {
    conditions.push(["new_2526", "eq", "Y"]);
  }

  if (filters.passType === "full-only") {
    conditions.push(["full_pass_days", "ne", "N/A"]);
  }

  if (filters.passType === "base-included") {
    conditions.push(["base_pass_days", "ne", "N/A"]);
  }

  if (filters.search) {
    conditions.push(["name", "cn", filters.search]);
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];

  // Build right-associative AND tree
  let result: FeltFilter = conditions[conditions.length - 1];
  for (let i = conditions.length - 2; i >= 0; i--) {
    result = [conditions[i], "and", result];
  }
  return result;
}

/* ── Component ────────────────────────────────────────────── */
export function FeltMap({ filters, selectedResort }: FeltMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const feltRef = useRef<FeltController | null>(null);
  const featureLookupRef = useRef<Map<string, string | number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Embed the Felt map
  useEffect(() => {
    if (!FELT_MAP_ID || !containerRef.current) {
      if (!FELT_MAP_ID) setError("NEXT_PUBLIC_FELT_MAP_ID not set");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function embedMap() {
      try {
        const { Felt } = await import("@feltmaps/js-sdk");
        if (cancelled || !containerRef.current) return;

        const map = await Felt.embed(containerRef.current, FELT_MAP_ID!, {
          uiControls: { cooperativeGestures: false, showLegend: false },
        });
        if (cancelled) return;

        const controller = map as unknown as FeltController;
        feltRef.current = controller;

        // Build resort-name → feature-id lookup for selectFeature
        if (FELT_LAYER_ID) {
          try {
            const { features } = await controller.getFeatures({
              layerId: FELT_LAYER_ID,
              limit: 200,
            });
            const lookup = new Map<string, string | number>();
            for (const f of features) {
              const name = f.properties?.name as string;
              if (name) lookup.set(name, f.id);
            }
            featureLookupRef.current = lookup;
          } catch (e) {
            console.warn("Could not build feature lookup:", e);
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to embed Felt map:", err);
        setError("Failed to load map. Using iframe fallback.");
        setIsLoading(false);
      }
    }

    embedMap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply sidebar filters to the data layer
  useEffect(() => {
    if (!feltRef.current || !FELT_LAYER_ID) return;

    const feltFilter = buildFeltFilter(filters);
    feltRef.current
      .setLayerFilters({ layerId: FELT_LAYER_ID, filters: feltFilter })
      .catch((err) => console.warn("setLayerFilters error:", err));
  }, [filters]);

  // Select feature + open popup on resort click
  useEffect(() => {
    if (!feltRef.current || !selectedResort) return;

    if (FELT_LAYER_ID) {
      const featureId = featureLookupRef.current.get(selectedResort.name);
      if (featureId != null) {
        feltRef.current
          .selectFeature({
            id: featureId,
            layerId: FELT_LAYER_ID,
            showPopup: true,
            fitViewport: { maxZoom: 10 },
          })
          .catch((err) => console.warn("selectFeature error:", err));
        return;
      }
    }

    // Fallback: just pan to resort coordinates
    feltRef.current
      .setViewport({
        center: {
          latitude: selectedResort.latitude,
          longitude: selectedResort.longitude,
        },
        zoom: 10,
      })
      .catch(() => {});
  }, [selectedResort]);

  // No map ID configured
  if (!FELT_MAP_ID) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="max-w-md text-center px-8">
          <div className="mb-4 text-4xl">🗺️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Map Not Configured
          </h2>
          <p className="mb-4 text-sm text-muted">
            Run the setup script to create your Felt map, then add the map ID to
            your environment variables.
          </p>
          <pre className="rounded-lg bg-surface p-4 text-left text-xs text-muted">
            <code>
              {`# 1. Create the Felt map\nnpm run setup:map\n\n# 2. Copy the map ID to .env.local\nNEXT_PUBLIC_FELT_MAP_ID=your-map-id`}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  // Error fallback
  if (error) {
    return (
      <div className="felt-map h-full w-full">
        <iframe
          src={`https://felt.com/embed/map/${FELT_MAP_ID}?cooperativeGestures=false`}
          width="100%"
          height="100%"
          title="Ikon Pass Resort Map"
          style={{ border: "none" }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-ikon" />
            <span className="text-sm text-muted">Loading map...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="felt-map h-full w-full" />
    </div>
  );
}
