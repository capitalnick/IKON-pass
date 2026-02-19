"use client";

import { useEffect, useRef, useState } from "react";
import { Resort, Filters } from "@/types";
import { resorts as allResorts } from "@/data/resorts";
import type { Viewport } from "@/lib/geoProject";

const FELT_MAP_ID = process.env.NEXT_PUBLIC_FELT_MAP_ID;

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
interface FeltLayer {
  id: string;
  name: string;
  geometry_type?: string;
}

interface FeltFeature {
  id: string | number;
  properties: Record<string, unknown>;
}

interface FeltClickFeature {
  id: string | number;
  layerId: string;
  properties: Record<string, unknown>;
}

interface FeltClickEvent {
  coordinate: { latitude: number; longitude: number };
  point: { x: number; y: number };
  features: FeltClickFeature[];
}

interface FeltViewportState {
  center: { latitude: number; longitude: number };
  zoom: number;
}

interface FeltController {
  setViewport(opts: {
    center: { latitude: number; longitude: number };
    zoom: number;
  }): Promise<void>;
  getViewport(): Promise<FeltViewportState>;
  getLayers(): Promise<Array<FeltLayer | null>>;
  setLayerFilters(params: {
    layerId: string;
    filters: FeltFilter;
    note?: string;
  }): Promise<void>;
  getFeatures(params: {
    layerId: string;
    limit?: number;
  }): Promise<{
    features: FeltFeature[];
    count: number;
  }>;
  selectFeature(params: {
    id: string | number;
    layerId: string;
    showPopup?: boolean;
    fitViewport?: boolean | { maxZoom: number };
  }): Promise<void>;
  onPointerClick(params: {
    handler: (event: FeltClickEvent) => void;
  }): () => void;
  onViewportMove(params: {
    handler: (viewport: FeltViewportState) => void;
  }): () => void;
  onViewportMoveEnd(params: {
    handler: (viewport: FeltViewportState) => void;
  }): () => void;
  clearSelection(params?: {
    features?: boolean;
    elements?: boolean;
  }): Promise<void>;
}

/* ── Props ────────────────────────────────────────────────── */
interface FeltMapProps {
  filters: Filters;
  selectedResort: Resort | null;
  onResortSelect?: (resort: Resort) => void;
  onViewportChange?: (viewport: Viewport) => void;
  mapContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/* ── Build Felt-compatible filter from sidebar state ──────── */
function buildFeltFilter(filters: Filters): FeltFilter {
  const conditions: FeltFilterExpr[] = [];

  if (filters.macroRegions.length > 0) {
    conditions.push(["macro_region", "in", filters.macroRegions]);
  }

  // dayBankGroup filtering is handled client-side by applyFilters

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

/* ── Resort name → Resort lookup ──────────────────────────── */
const resortByName = new Map<string, Resort>();
for (const r of allResorts) {
  resortByName.set(r.name, r);
}

/* ── Component ────────────────────────────────────────────── */
export function FeltMap({
  filters,
  selectedResort,
  onResortSelect,
  onViewportChange,
  mapContainerRef,
}: FeltMapProps) {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = mapContainerRef ?? internalContainerRef;
  const feltRef = useRef<FeltController | null>(null);
  const layerIdRef = useRef<string | null>(null);
  const featureLookupRef = useRef<Map<string, string | number>>(new Map());
  const onResortSelectRef = useRef(onResortSelect);
  onResortSelectRef.current = onResortSelect;
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;
  const unsubClickRef = useRef<(() => void) | null>(null);
  const unsubViewportRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layerReady, setLayerReady] = useState(false);

  // Embed the Felt map, discover the data layer, build feature lookup
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
        setIsLoading(false);

        // Seed initial viewport
        try {
          const vp = await controller.getViewport();
          if (!cancelled) {
            onViewportChangeRef.current?.({ center: vp.center, zoom: vp.zoom });
          }
        } catch (_) {}

        // Subscribe to viewport changes — keeps overlay anchored to lat/lng
        try {
          unsubViewportRef.current = controller.onViewportMove({
            handler: (vp) => {
              onViewportChangeRef.current?.({ center: vp.center, zoom: vp.zoom });
            },
          });
        } catch (_) {}

        // Discover the data layer
        let dataLayerId: string | null = null;

        for (let attempt = 0; attempt < 10; attempt++) {
          const layers = await controller.getLayers();
          console.log(
            "[FeltMap] getLayers attempt",
            attempt + 1,
            "→",
            layers
              .filter(Boolean)
              .map((l) => `${l!.name} (${l!.id})`),
          );

          const found = layers.find(
            (l) => l && l.name === "Ikon Resorts",
          );
          if (found) {
            dataLayerId = found.id;
            break;
          }

          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
        }

        if (!dataLayerId) {
          console.warn("[FeltMap] Could not find 'Ikon Resorts' layer");
          return;
        }

        layerIdRef.current = dataLayerId;
        console.log("[FeltMap] Data layer discovered:", dataLayerId);

        // Build resort-name → feature-id lookup
        try {
          const { features, count } = await controller.getFeatures({
            layerId: dataLayerId,
            limit: 200,
          });
          console.log(
            "[FeltMap] Features loaded:",
            count,
            "— first:",
            features[0],
          );

          const lookup = new Map<string, string | number>();
          for (const f of features) {
            const name = f.properties?.name as string;
            if (name) lookup.set(name, f.id);
          }
          featureLookupRef.current = lookup;
          console.log("[FeltMap] Feature lookup:", lookup.size, "entries");
        } catch (e) {
          console.warn("[FeltMap] getFeatures failed:", e);
        }

        // Listen for marker clicks → resolve to Resort and notify parent
        unsubClickRef.current = controller.onPointerClick({
          handler: (event) => {
            const clickedFeature = event.features.find(
              (f) => f.layerId === dataLayerId,
            );
            if (!clickedFeature) return;

            const name = clickedFeature.properties?.name as string | undefined;
            if (!name) return;

            const resort = resortByName.get(name);
            if (resort) {
              console.log("[FeltMap] Marker clicked:", name);
              // Dismiss Felt's native popup immediately
              controller.clearSelection({ features: true }).catch(() => {});
              onResortSelectRef.current?.(resort);
            }
          },
        });

        if (!cancelled) setLayerReady(true);
      } catch (err) {
        if (cancelled) return;
        console.error("[FeltMap] Embed failed:", err);
        setError("Failed to load map. Using iframe fallback.");
        setIsLoading(false);
      }
    }

    embedMap();
    return () => {
      cancelled = true;
      unsubClickRef.current?.();
      unsubViewportRef.current?.();
    };
  }, []);

  // Apply sidebar filters to the data layer
  useEffect(() => {
    const layerId = layerIdRef.current;
    if (!feltRef.current || !layerId || !layerReady) return;

    const feltFilter = buildFeltFilter(filters);
    console.log("[FeltMap] Applying filter:", JSON.stringify(feltFilter));

    feltRef.current
      .setLayerFilters({ layerId, filters: feltFilter })
      .then(() => console.log("[FeltMap] Filter applied"))
      .catch((err) => console.warn("[FeltMap] setLayerFilters error:", err));
  }, [filters, layerReady]);

  // Select feature on resort click (highlight marker, pan map)
  useEffect(() => {
    const layerId = layerIdRef.current;
    if (!feltRef.current || !selectedResort) return;

    if (layerId && layerReady) {
      const featureId = featureLookupRef.current.get(selectedResort.name);

      if (featureId != null) {
        feltRef.current
          .selectFeature({
            id: featureId,
            layerId,
            showPopup: false,
            fitViewport: { maxZoom: 10 },
          })
          .catch((err) => console.warn("[FeltMap] selectFeature error:", err));
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
  }, [selectedResort, layerReady]);

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
        </div>
      </div>
    );
  }

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
