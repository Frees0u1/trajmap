/**
 * Web Mercator projection utilities
 */

import { LatLng, PixelPoint, GeoBounds, PixelBounds } from '../types';
const { SphericalMercator } = require('@mapbox/sphericalmercator');

/**
 * Web Mercator projection utilities
 */
export class MercatorUtil {
  private static readonly mercator = new SphericalMercator({ size: 256 });
  private static readonly mercatorRetina = new SphericalMercator({ size: 512 });

  /**
   * Get the appropriate SphericalMercator instance based on retina setting
   */
  private static getMercator(retina: boolean = false): any {
    return retina ? MercatorUtil.mercatorRetina : MercatorUtil.mercator;
  }

  /**
   * Get tile size based on retina setting
   */
  static getTileSize(retina: boolean = false): number {
    return retina ? 512 : 256;
  }

  /**
   * Convert latitude/longitude to Web Mercator meters
   */
  static latLngToMeters(latLng: LatLng, retina: boolean = false): { x: number; y: number } {
    const [x, y] = MercatorUtil.getMercator(retina).forward([latLng.lng, latLng.lat]);
    return { x, y };
  }

  /**
   * Convert Web Mercator meters to latitude/longitude
   */
  static metersToLatLng(x: number, y: number, retina: boolean = false): LatLng {
    const [lng, lat] = MercatorUtil.getMercator(retina).inverse([x, y]);
    return { lat, lng };
  }

  /**
   * Convert latitude/longitude to tile coordinates
   */
  static latLngToTile(latLng: LatLng, zoom: number, retina: boolean = false): { x: number; y: number } {
    // Use px method to convert lat/lng to pixel coordinates at given zoom level
    const [px, py] = MercatorUtil.getMercator(retina).px([latLng.lng, latLng.lat], zoom);
    
    // Convert pixel coordinates to tile coordinates
    const tileSize = MercatorUtil.getTileSize(retina);
    const x = Math.floor(px / tileSize);
    const y = Math.floor(py / tileSize);
    
    return { x, y };
  }

  /**
   * Convert tile coordinates to latitude/longitude bounds
   */
  static tileToBounds(x: number, y: number, zoom: number, retina: boolean = false): GeoBounds {
    const bbox = MercatorUtil.getMercator(retina).bbox(x, y, zoom); // [west, south, east, north]
    return {
      minLng: bbox[0],
      minLat: bbox[1],
      maxLng: bbox[2],
      maxLat: bbox[3]
    };
  }

  /**
   * Convert geographic bounds to pixel bounds within an image
   */
  static geoBoundsToPixelBounds(
    targetBounds: GeoBounds,
    imageBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number,
    zoom: number,
    retina: boolean = false
  ): PixelBounds {
    const mercator = MercatorUtil.getMercator(retina);
    
    // Convert target bounds to pixel coordinates
    const [minX, maxY] = mercator.px([targetBounds.minLng, targetBounds.minLat], zoom);
    const [maxX, minY] = mercator.px([targetBounds.maxLng, targetBounds.maxLat], zoom);
    
    // Convert image bounds to pixel coordinates for offset calculation
    const [imageMinX, imageMaxY] = mercator.px([imageBounds.minLng, imageBounds.minLat], zoom);
    const [imageMaxX, imageMinY] = mercator.px([imageBounds.maxLng, imageBounds.maxLat], zoom);
    
    // Calculate relative pixel positions within the image using proper scaling
    const relativeMinX = Math.floor((minX - imageMinX) * imageWidth / (imageMaxX - imageMinX));
    const relativeMaxX = Math.ceil((maxX - imageMinX) * imageWidth / (imageMaxX - imageMinX));
    const relativeMinY = Math.floor((minY - imageMinY) * imageHeight / (imageMaxY - imageMinY));
    const relativeMaxY = Math.ceil((maxY - imageMinY) * imageHeight / (imageMaxY - imageMinY));
    
    return { 
      minX: relativeMinX, 
      maxX: relativeMaxX, 
      minY: relativeMinY, 
      maxY: relativeMaxY 
    };
  }

  /**
   * Convert latitude/longitude coordinates to pixel coordinates within an image
   * 
   * @param latLng GPS coordinate point to convert
   * @param imageBounds Geographic boundary range covered by the image
   * @param imageWidth Image width in pixels
   * @param imageHeight Image height in pixels
   * @param zoom Zoom level to use for conversion
   * @param retina Whether to use retina/high-DPI tiles (512x512 instead of 256x256)
   * @returns Corresponding pixel coordinate point
   * 
   * Calculation principle:
   * 1. Use provided zoom level
   * 2. Convert coordinates to pixel coordinates using spherical mercator projection
   * 3. Calculate relative position within the image bounds
   */
  static latLngToPixel(
    latLng: LatLng,
    imageBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number,
    zoom: number,
    retina: boolean = false
  ): PixelPoint {
    const mercator = MercatorUtil.getMercator(retina);
    
    // Convert target point to pixel coordinates
    const [targetX, targetY] = mercator.px([latLng.lng, latLng.lat], zoom);
    
    // Convert image bounds to pixel coordinates for offset calculation
    const [imageMinX, imageMaxY] = mercator.px([imageBounds.minLng, imageBounds.minLat], zoom);
    const [imageMaxX, imageMinY] = mercator.px([imageBounds.maxLng, imageBounds.maxLat], zoom);
    
    // Calculate relative pixel position within the image
    const x = (targetX - imageMinX) * imageWidth / (imageMaxX - imageMinX);
    const y = (targetY - imageMinY) * imageHeight / (imageMaxY - imageMinY);
    
    return { x, y };
  }
}