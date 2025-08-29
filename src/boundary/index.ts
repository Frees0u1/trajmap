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

    // Calculate initial bounds from GPS points (bound0)
    const bound0 = GeoUtil.calculateBounds(gpsPoints);

    // Add default 10% buffer according to architecture requirements (bound1)
    // Formula: (length + width) / 2 * 10%
    const bound1 = GeoUtil.expandBufferBounds(bound0, 10);

    // Adjust bounds to match track region aspect ratio (bound2)
    const bound2 = GeoUtil.adjustBoundsToAspectRatio(bound1, trackRegion);

    // Apply expansion region if provided (bound3)
    let bound3 = bound2;
    if (expansionRegion) {
      bound3 = GeoUtil.applyExpansionRegion(bound2, expansionRegion);
    }

    return {
      bounds: bound3,  // 最终边界框
      bound0,  // 初始轨迹框
      bound1,  // 10% buffer框
      bound2,  // 适配trackRegion的扩展框
      bound3   // 适配expansion的扩展框
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