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

    // Calculate initial bounds from GPS points (step 1)
    const step1InitBound = GeoUtil.calculateBounds(gpsPoints);

    // Add default 10% buffer according to architecture requirements (step 2)
    // Buffer calculation: (width + height) / 2 * 10%
    const step2BufferBound = GeoUtil.expandBufferBounds(step1InitBound, 10);

    // Adjust bounds to match track region aspect ratio (step 3)
    const step3TrackBound = GeoUtil.adjustBoundsToAspectRatio(step2BufferBound, trackRegion);

    // Apply expansion region if provided (step 4)
    let step4ExpansionBound = step3TrackBound;
    if (expansionRegion) {
      step4ExpansionBound = GeoUtil.applyExpansionRegion(step3TrackBound, expansionRegion);
    }

    return {
      bounds: step4ExpansionBound,  // Final boundary box
      historyBounds: {
        step1InitBound,
        step2BufferBound,
        step3TrackBound,
        step4ExpansionBound
      }
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