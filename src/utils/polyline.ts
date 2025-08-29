import * as polyline from '@mapbox/polyline';
import { LatLng } from '../types';

/**
 * Polyline utility class
 * Used for processing and converting polyline format trajectory data
 */
export class PolylineUtil {
  /**
   * Decode polyline string to coordinate points array
   * @param encodedPolyline Encoded polyline string
   * @returns Array of coordinate points
   */
  static decode(encodedPolyline: string): LatLng[] {
    try {
      // Use @mapbox/polyline library to decode
      const points = polyline.decode(encodedPolyline);
      
      // Convert to LatLng format
      return points.map(point => ({
        lat: point[0],
        lng: point[1]
      }));
    } catch (error) {
      console.error('Failed to decode polyline:', error);
      throw new Error('Invalid polyline format');
    }
  }

  /**
   * Encode coordinate points array to polyline string
   * @param points Array of coordinate points
   * @returns Encoded polyline string
   */
  static encode(points: LatLng[]): string {
    try {
      // Convert to format required by polyline library
      const rawPoints = points.map(point => [point.lat, point.lng] as [number, number]);
      
      // Use @mapbox/polyline library to encode
      return polyline.encode(rawPoints);
    } catch (error) {
      console.error('Failed to encode polyline:', error);
      throw new Error('Invalid points format');
    }
  }

  /**
   * Calculate trajectory boundaries
   * @param points Array of coordinate points
   * @returns Boundary object {north, south, east, west}
   */
  static getBounds(points: LatLng[]): { north: number; south: number; east: number; west: number } {
    if (!points || points.length === 0) {
      throw new Error('Empty points array');
    }

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    for (const point of points) {
      north = Math.max(north, point.lat);
      south = Math.min(south, point.lat);
      east = Math.max(east, point.lng);
      west = Math.min(west, point.lng);
    }

    return { north, south, east, west };
  }
}