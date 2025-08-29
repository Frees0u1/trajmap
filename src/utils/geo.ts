import { LatLng, Bounds } from '../types';

/**
 * Geographic coordinate utility class
 * Used for geographic coordinate related calculations
 */
export class GeoUtil {
  /**
   * Convert latitude and longitude coordinates to tile coordinates
   * @param lat Latitude
   * @param lng Longitude
   * @param zoom Zoom level
   * @returns Tile coordinates [x, y]
   */
  static latLngToTile(lat: number, lng: number, zoom: number): [number, number] {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return [x, y];
  }

  /**
   * Calculate distance between two points (meters)
   * @param point1 First point
   * @param point2 Second point
   * @returns Distance (meters)
   */
  static distance(point1: LatLng, point2: LatLng): number {
    const R = 6371e3; // Earth radius (meters)
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate suitable zoom level for displaying trajectory
   * @param bounds Trajectory boundaries
   * @param width Image width
   * @param height Image height
   * @param padding Padding
   * @returns Zoom level
   */
  static calculateZoom(bounds: Bounds, width: number, height: number, padding: number = 50): number {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 18;

    function latRad(lat: number) {
      const sin = Math.sin((lat * Math.PI) / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx: number, worldPx: number, fraction: number) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI;
    const lngDiff = bounds.east - bounds.west;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = zoom(height - padding * 2, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(width - padding * 2, WORLD_DIM.width, lngFraction);

    return Math.min(Math.min(latZoom, lngZoom), ZOOM_MAX);
  }
}