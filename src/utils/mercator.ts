/**
 * Web Mercator projection utilities
 */

import { LatLng, PixelPoint, GeoBounds, PixelBounds } from '../types';

/**
 * Web Mercator projection utilities
 */
export class MercatorUtil {
  private static readonly EARTH_RADIUS = 6378137; // Earth radius in meters
  private static readonly ORIGIN_SHIFT = 2 * Math.PI * MercatorUtil.EARTH_RADIUS / 2;

  /**
   * Convert latitude/longitude to Web Mercator meters
   */
  static latLngToMeters(latLng: LatLng): { x: number; y: number } {
    const x = latLng.lng * MercatorUtil.ORIGIN_SHIFT / 180;
    let y = Math.log(Math.tan((90 + latLng.lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * MercatorUtil.ORIGIN_SHIFT / 180;
    return { x, y };
  }

  /**
   * Convert Web Mercator meters to latitude/longitude
   */
  static metersToLatLng(x: number, y: number): LatLng {
    const lng = (x / MercatorUtil.ORIGIN_SHIFT) * 180;
    let lat = (y / MercatorUtil.ORIGIN_SHIFT) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return { lat, lng };
  }

  /**
   * Convert latitude/longitude to tile coordinates
   */
  static latLngToTile(latLng: LatLng, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor((latLng.lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latLng.lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
  }

  /**
   * Convert tile coordinates to latitude/longitude bounds
   */
  static tileToBounds(x: number, y: number, zoom: number): GeoBounds {
    const n = Math.pow(2, zoom);
    const minLng = x / n * 360 - 180;
    const maxLng = (x + 1) / n * 360 - 180;
    const minLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    const maxLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    
    return { minLat, maxLat, minLng, maxLng };
  }

  /**
   * Convert geographic bounds to pixel bounds within an image
   */
  static geoBoundsToPixelBounds(
    targetBounds: GeoBounds,
    imageBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number
  ): PixelBounds {
    const lngRange = imageBounds.maxLng - imageBounds.minLng;
    const latRange = imageBounds.maxLat - imageBounds.minLat;
    
    const minX = Math.floor((targetBounds.minLng - imageBounds.minLng) / lngRange * imageWidth);
    const maxX = Math.ceil((targetBounds.maxLng - imageBounds.minLng) / lngRange * imageWidth);
    const minY = Math.floor((imageBounds.maxLat - targetBounds.maxLat) / latRange * imageHeight);
    const maxY = Math.ceil((imageBounds.maxLat - targetBounds.minLat) / latRange * imageHeight);
    
    return { minX, maxX, minY, maxY };
  }

  /**
   * Convert latitude/longitude coordinates to pixel coordinates within an image
   * 
   * @param latLng GPS coordinate point to convert
   * @param imageBounds Geographic boundary range covered by the image
   * @param imageWidth Image width in pixels
   * @param imageHeight Image height in pixels
   * @returns Corresponding pixel coordinate point
   * 
   * Calculation principle:
   * 1. Calculate relative position of target point within image bounds (ratio between 0-1)
   * 2. Convert relative position to specific pixel coordinates
   * 3. Note Y-axis direction: higher latitude means more north in geographic coordinates,
   *    but higher Y value means lower position in pixel coordinates
   */
  static latLngToPixel(
    latLng: LatLng,
    imageBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number
  ): PixelPoint {
    const lngRange = imageBounds.maxLng - imageBounds.minLng;
    const latRange = imageBounds.maxLat - imageBounds.minLat;
    
    const x = (latLng.lng - imageBounds.minLng) / lngRange * imageWidth;
    const y = (imageBounds.maxLat - latLng.lat) / latRange * imageHeight;
    
    return { x, y };
  }
}