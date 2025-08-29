/**
 * Geographic calculation utilities
 */

import { LatLng, GeoBounds, TrackRegion, ExpansionRegion } from '../types';
import { MercatorUtil } from './mercator';
import { ValidationUtil } from './validation';

/**
 * Geographic utilities
 */
export class GeoUtil {
  private static readonly EARTH_RADIUS = 6371000; // Earth radius in meters

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: LatLng, point2: LatLng): number {
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return GeoUtil.EARTH_RADIUS * c;
  }

  /**
   * Calculate bounds from GPS points
   */
  static calculateBounds(points: LatLng[]): GeoBounds {
    if (points.length === 0) {
      throw new Error('Cannot calculate bounds from empty points array');
    }

    let minLat = points[0].lat;
    let maxLat = points[0].lat;
    let minLng = points[0].lng;
    let maxLng = points[0].lng;

    for (const point of points) {
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
      minLng = Math.min(minLng, point.lng);
      maxLng = Math.max(maxLng, point.lng);
    }

    return { minLat, maxLat, minLng, maxLng };
  }

  /**
   * Expand bounds by percentage
   */
  static expandBufferBounds(bounds: GeoBounds, percentage: number): GeoBounds {
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    const avgRange = (latRange + lngRange) / 2;
    const expansion = avgRange * percentage / 100;

    return {
      minLat: bounds.minLat - expansion,
      maxLat: bounds.maxLat + expansion,
      minLng: bounds.minLng - expansion,
      maxLng: bounds.maxLng + expansion
    };
  }

  /**
   * Adjust bounds to match aspect ratio
   * Uses Web Mercator projection for accurate distance calculations
   */
  static adjustBoundsToAspectRatio(bounds: GeoBounds, trackRegion: TrackRegion): GeoBounds {
    const targetRatio = trackRegion.width / trackRegion.height;
    
    // Convert bounds to Mercator coordinates for accurate distance calculation
    const minPoint = MercatorUtil.latLngToMeters({ lat: bounds.minLat, lng: bounds.minLng });
    const maxPoint = MercatorUtil.latLngToMeters({ lat: bounds.maxLat, lng: bounds.maxLng });
    
    const widthMeters = maxPoint.x - minPoint.x;
    const heightMeters = maxPoint.y - minPoint.y;
    const currentRatio = widthMeters / heightMeters;

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const centerPoint = MercatorUtil.latLngToMeters({ lat: centerLat, lng: centerLng });

    if (currentRatio < targetRatio) {
      // Need to expand width (longitude)
      const newWidthMeters = heightMeters * targetRatio;
      
      const newMinPoint = MercatorUtil.metersToLatLng(centerPoint.x - newWidthMeters / 2, minPoint.y);
      const newMaxPoint = MercatorUtil.metersToLatLng(centerPoint.x + newWidthMeters / 2, maxPoint.y);
      
      return {
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: newMinPoint.lng,
        maxLng: newMaxPoint.lng
      };
    } else {
      // Need to expand height (latitude)
      const newHeightMeters = widthMeters / targetRatio;
      
      const newMinPoint = MercatorUtil.metersToLatLng(minPoint.x, centerPoint.y - newHeightMeters / 2);
      const newMaxPoint = MercatorUtil.metersToLatLng(maxPoint.x, centerPoint.y + newHeightMeters / 2);
      
      return {
        minLat: newMinPoint.lat,
        maxLat: newMaxPoint.lat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng
      };
    }
  }

  /**
   * Apply expansion region to bounds
   */
  static applyExpansionRegion(bounds: GeoBounds, expansion?: ExpansionRegion): GeoBounds {
    // If no expansion is provided, return original bounds
    if (!expansion) {
      return bounds;
    }

    // Validate expansion region
    ValidationUtil.validateExpansionRegion(expansion);

    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    const upExpansion = expansion.upPercent ? latRange * expansion.upPercent : 0;
    const downExpansion = expansion.downPercent ? latRange * expansion.downPercent : 0;
    const leftExpansion = expansion.leftPercent ? lngRange * expansion.leftPercent : 0;
    const rightExpansion = expansion.rightPercent ? lngRange * expansion.rightPercent : 0;

    return {
      minLat: bounds.minLat - downExpansion,
      maxLat: bounds.maxLat + upExpansion,
      minLng: bounds.minLng - leftExpansion,
      maxLng: bounds.maxLng + rightExpansion
    };
  }

  /**
   * Calculate appropriate zoom level for bounds
   * Returns the maximum zoom level that cannot fully cover the bounds
   */

}