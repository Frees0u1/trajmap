/**
 * Boundary determination module
 * Calculates track bounds and applies expansion
 */

import { LatLng, GeoBounds, TrackRegion, ExpansionRegion, BoundaryResult } from '../types';
import { GeoUtil } from '../utils/geo';

/**
 * Boundary service
 */
export class BoundaryService {
  /**
   * Calculate bounds for GPS points with expansion
   */
  static calculateBounds(
    gpsPoints: LatLng[],
    trackRegion: TrackRegion,
    expansionRegion?: ExpansionRegion
  ): BoundaryResult {
    if (gpsPoints.length === 0) {
      throw new Error('Cannot calculate bounds from empty GPS points');
    }

    // Calculate initial bounds from GPS points
    let bounds = GeoUtil.calculateBounds(gpsPoints);

    // Apply expansion region if provided
    if (expansionRegion) {
      bounds = GeoUtil.applyExpansionRegion(bounds, expansionRegion);
    }

    // Adjust bounds to match track region aspect ratio
    bounds = GeoUtil.adjustBoundsToAspectRatio(bounds, trackRegion);

    // Calculate appropriate zoom level
    const zoom = GeoUtil.calculateZoom(bounds);

    return {
      bounds,
      zoom
    };
  }

  /**
   * Validate bounds
   */
  static validateBounds(bounds: GeoBounds): void {
    if (bounds.minLat >= bounds.maxLat) {
      throw new Error('Invalid latitude bounds: min must be less than max');
    }

    if (bounds.minLng >= bounds.maxLng) {
      throw new Error('Invalid longitude bounds: min must be less than max');
    }

    if (bounds.minLat < -90 || bounds.maxLat > 90) {
      throw new Error('Latitude bounds must be within -90 to 90 degrees');
    }

    if (bounds.minLng < -180 || bounds.maxLng > 180) {
      throw new Error('Longitude bounds must be within -180 to 180 degrees');
    }
  }

  /**
   * Calculate bounds center point
   */
  static getBoundsCenter(bounds: GeoBounds): LatLng {
    return {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2
    };
  }

  /**
   * Check if point is within bounds
   */
  static isPointInBounds(point: LatLng, bounds: GeoBounds): boolean {
    return point.lat >= bounds.minLat &&
           point.lat <= bounds.maxLat &&
           point.lng >= bounds.minLng &&
           point.lng <= bounds.maxLng;
  }
}