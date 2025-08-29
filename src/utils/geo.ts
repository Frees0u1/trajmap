/**
 * Geographic calculation utilities
 */

import { LatLng, GeoBounds, TrackRegion, ExpansionRegion } from '../types';

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
  static expandBounds(bounds: GeoBounds, percentage: number): GeoBounds {
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
   */
  static adjustBoundsToAspectRatio(bounds: GeoBounds, trackRegion: TrackRegion): GeoBounds {
    const targetRatio = trackRegion.width / trackRegion.height;
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    const currentRatio = lngRange / latRange;

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;

    if (currentRatio < targetRatio) {
      // Need to expand width (longitude)
      const newLngRange = latRange * targetRatio;
      const lngExpansion = (newLngRange - lngRange) / 2;
      return {
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: centerLng - newLngRange / 2,
        maxLng: centerLng + newLngRange / 2
      };
    } else {
      // Need to expand height (latitude)
      const newLatRange = lngRange / targetRatio;
      const latExpansion = (newLatRange - latRange) / 2;
      return {
        minLat: centerLat - newLatRange / 2,
        maxLat: centerLat + newLatRange / 2,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng
      };
    }
  }

  /**
   * Apply expansion region to bounds
   */
  static applyExpansionRegion(bounds: GeoBounds, expansion: ExpansionRegion): GeoBounds {
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    const upExpansion = expansion.up ? latRange * expansion.up / 100 : 0;
    const downExpansion = expansion.down ? latRange * expansion.down / 100 : 0;
    const leftExpansion = expansion.left ? lngRange * expansion.left / 100 : 0;
    const rightExpansion = expansion.right ? lngRange * expansion.right / 100 : 0;

    return {
      minLat: bounds.minLat - downExpansion,
      maxLat: bounds.maxLat + upExpansion,
      minLng: bounds.minLng - leftExpansion,
      maxLng: bounds.maxLng + rightExpansion
    };
  }

  /**
   * Calculate appropriate zoom level for bounds and image size
   */
  static calculateZoom(bounds: GeoBounds, imageWidth: number, imageHeight: number): number {
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    
    // Calculate zoom based on longitude range (more accurate for Web Mercator)
    const lngZoom = Math.floor(Math.log2(360 / lngRange));
    
    // Calculate zoom based on latitude range
    const latZoom = Math.floor(Math.log2(180 / latRange));
    
    // Use the smaller zoom to ensure the entire area fits
    const zoom = Math.min(lngZoom, latZoom, 18); // Max zoom 18
    
    return Math.max(zoom, 1); // Min zoom 1
  }
}