"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
interface FeltLayer {
  id: string;
  name: string;
  status: string;
}

interface FeltFeature {
  id: string | number;
  properties: Record<string, unknown>;
}

interface FeltController {
  setViewport(opts: {
    center: { latitude: number; longitude: number };
    zoom: number;
  }): Promise<void>;
  getLayer(id: string): Promise<FeltLayer | null>;
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
  onLayerChange(args: {
    options: { id: string };
    handler: (change: unknown) => void;
  }): () => void;
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

/* ── Retry helper ─────────────────────────────────────────── */
async function retry<T>(
  fn: () => Promise<T>,
  { attempts = 5, delay = 1500 }: { attempts?: number; delay?: number } = {},
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch {
      if (i === attempts - 1) throw new Error("Retry exhausted");
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Retry exhausted");
}

/* ── Component ────────────────────────────────────────────── */
export function FeltMap({ filters, selectedResort }: FeltMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const feltRef = useRef<FeltController | null>(null);
  const featureLookupRef = useRef<Map<string, string | number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layerReady, setLayerReady] = useState(false);

  // Embed the Felt map and wait for layer readiness
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

        // Wait for the data layer to be available
        if (FELT_LAYER_ID) {
          console.log("[FeltMap] Layer ID:", FELT_LAYER_ID);

          // Poll for layer readiness
          const layer = await retry(
            async () => {
              const l = await controller.getLayer(FELT_LAYER_ID!);
              if (!l) throw new Error("Layer not found yet");
              console.log("[FeltMap] Layer found:", l.name, l.status);
              return l;
            },
            { attempts: 10, delay: 2000 },
          );

          if (cancelled) return;
          console.log("[FeltMap] Layer ready:", layer.name);

          // Build resort-name → feature-id lookup
          try {
            const { features, count } = await controller.getFeatures({
              layerId: FELT_LAYER_ID!,
              limit: 200,
            });
            console.log(
              "[FeltMap] Features loaded:",
              count,
              "features, first:",
              features[0],
            );

            const lookup = new Map<string, string | number>();
            for (const f of features) {
              const name = f.properties?.name as string;
              if (name) lookup.set(name, f.id);
            }
            featureLookupRef.current = lookup;
            console.log("[FeltMap] Feature lookup built:", lookup.size, "entries");
          } catch (e) {
            console.warn("[FeltMap] getFeatures failed:", e);
          }

          if (!cancelled) setLayerReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[FeltMap] Failed to embed Felt map:", err);
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
    if (!feltRef.current || !FELT_LAYER_ID || !layerReady) return;

    const feltFilter = buildFeltFilter(filters);
    console.log("[FeltMap] Applying filter:", JSON.stringify(feltFilter));

    feltRef.current
      .setLayerFilters({ layerId: FELT_LAYER_ID, filters: feltFilter })
      .then(() => console.log("[FeltMap] Filter applied"))
      .catch((err) => console.warn("[FeltMap] setLayerFilters error:", err));
  }, [filters, layerReady]);

  // Select feature + open popup on resort click
  useEffect(() => {
    if (!feltRef.current || !selectedResort) return;

    if (FELT_LAYER_ID && layerReady) {
      const featureId = featureLookupRef.current.get(selectedResort.name);
      console.log(
        "[FeltMap] Selecting resort:",
        selectedResort.name,
        "→ featureId:",
        featureId,
      );

      if (featureId != null) {
        feltRef.current
          .selectFeature({
            id: featureId,
            layerId: FELT_LAYER_ID,
            showPopup: true,
            fitViewport: { maxZoom: 10 },
          })
          .then(() => console.log("[FeltMap] Feature selected"))
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
