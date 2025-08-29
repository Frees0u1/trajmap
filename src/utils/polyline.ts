/**
 * Polyline encoding/decoding utilities
 */

import { LatLng } from '../types';

/**
 * Polyline utilities for encoding and decoding GPS trajectories
 */
export class PolylineUtil {
  /**
   * Decode polyline string to GPS points
   */
  static decode(polyline: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push({
        lat: lat * 1e-5,
        lng: lng * 1e-5
      });
    }

    return points;
  }

  /**
   * Encode GPS points to polyline string
   */
  static encode(points: LatLng[]): string {
    if (points.length === 0) {
      return '';
    }

    let polyline = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);

      const deltaLat = lat - prevLat;
      const deltaLng = lng - prevLng;

      polyline += PolylineUtil.encodeValue(deltaLat);
      polyline += PolylineUtil.encodeValue(deltaLng);

      prevLat = lat;
      prevLng = lng;
    }

    return polyline;
  }

  /**
   * Encode a single value for polyline
   */
  private static encodeValue(value: number): string {
    value = value < 0 ? ~(value << 1) : (value << 1);
    let encoded = '';

    while (value >= 0x20) {
      encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }

    encoded += String.fromCharCode(value + 63);
    return encoded;
  }

  /**
   * Validate polyline string format
   */
  static validate(polyline: string): boolean {
    if (!polyline || typeof polyline !== 'string') {
      return false;
    }

    try {
      const points = PolylineUtil.decode(polyline);
      return points.length > 0;
    } catch (error) {
      return false;
    }
  }
}