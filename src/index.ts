import { MapRenderer } from './renderer/mapRenderer';
import { RenderOptions, LatLng, Bounds, TileProvider } from './types';
import { PolylineUtil } from './utils/polyline';
import { GeoUtil } from './utils/geo';
import { TileService } from './services/tileProvider';

/**
 * Render trajectory
 * @param options Rendering options
 * @returns Promise<void>
 */
export async function renderTrajectory(options: RenderOptions): Promise<void> {
  const renderer = new MapRenderer(options);
  await renderer.render();
}

// Export all related classes and types
export {
  MapRenderer,
  PolylineUtil,
  GeoUtil,
  TileService
};

// Re-export types
export type {
  RenderOptions,
  LatLng,
  Bounds,
  TileProvider
};