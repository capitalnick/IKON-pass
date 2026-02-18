/**
 * Mercator projection: convert lat/lng + viewport state → pixel position
 * within a container of known dimensions.
 *
 * Used to position overlays that must track geographic coordinates
 * as the map pans and zooms.
 */

export interface Viewport {
  center: { latitude: number; longitude: number };
  zoom: number;
}

const TILE_SIZE = 256;

function projectX(lng: number, scale: number): number {
  return ((lng + 180) / 360) * scale;
}

function projectY(lat: number, scale: number): number {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
}

export function lngLatToPixel(
  lng: number,
  lat: number,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number } {
  const scale = TILE_SIZE * Math.pow(2, viewport.zoom);

  const centerX = projectX(viewport.center.longitude, scale);
  const centerY = projectY(viewport.center.latitude, scale);
  const pointX = projectX(lng, scale);
  const pointY = projectY(lat, scale);

  return {
    x: containerWidth / 2 + (pointX - centerX),
    y: containerHeight / 2 + (pointY - centerY),
  };
}
