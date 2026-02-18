"use client";

import { useEffect, useRef, useState } from "react";
import { Resort } from "@/types";

const FELT_MAP_ID = process.env.NEXT_PUBLIC_FELT_MAP_ID;

interface FeltMapProps {
  selectedResort: Resort | null;
}

export function FeltMap({ selectedResort }: FeltMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const feltRef = useRef<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Embed the Felt map
  useEffect(() => {
    if (!FELT_MAP_ID || !containerRef.current) {
      if (!FELT_MAP_ID) {
        setError("NEXT_PUBLIC_FELT_MAP_ID not set");
      }
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function embedMap() {
      try {
        const { Felt } = await import("@feltmaps/js-sdk");
        if (cancelled || !containerRef.current) return;

        const map = await Felt.embed(containerRef.current, FELT_MAP_ID!, {
          uiControls: {
            cooperativeGestures: false,
            showLegend: false,
          },
        });
        if (cancelled) return;

        feltRef.current = map;
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

  // Pan to selected resort
  useEffect(() => {
    if (!selectedResort || !feltRef.current) return;

    const map = feltRef.current as {
      setViewport: (opts: {
        center: { latitude: number; longitude: number };
        zoom: number;
      }) => Promise<void>;
    };

    map
      .setViewport({
        center: {
          latitude: selectedResort.latitude,
          longitude: selectedResort.longitude,
        },
        zoom: 10,
      })
      .catch(() => {
        /* SDK method may not be available */
      });
  }, [selectedResort]);

  // No map ID configured - show placeholder
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

  // Error state - fall back to iframe embed
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
