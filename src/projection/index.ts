/**
 * Trajectory projection module
 * Handles GPS trajectory projection onto map images
 */

import { LatLng, GeoBounds, PixelPoint, PixelBounds, TrackRegion, ProjectionResult } from '../types';
import { MercatorUtil } from '../utils/mercator';

/**
 * Projection service
 */
export class ProjectionService {
  /**
   * Project GPS trajectory onto map image
   */
  static projectTrajectory(
    gpsPoints: LatLng[],
    mapImage: Buffer,
    mapBounds: GeoBounds,
    trackRegion: TrackRegion,
    zoom: number,
    lineColor: string = '#FF5500',
    lineWidth: number = 3
  ): ProjectionResult {
    if (gpsPoints.length === 0) {
      throw new Error('No GPS points to project');
    }

    // Convert GPS points to pixel coordinates
    const pixelPoints = gpsPoints.map(point => 
      MercatorUtil.latLngToPixel(point, mapBounds, trackRegion.width, trackRegion.height, zoom)
    );

    // Validate pixel points are within image bounds
    ProjectionService.validatePixelPoints(pixelPoints, trackRegion.width, trackRegion.height);

    // In a real implementation, this would:
    // 1. Create a canvas or image context from mapImage
    // 2. Set line style (color, width, etc.)
    // 3. Draw the trajectory path connecting all pixel points
    // 4. Return the final image buffer
    
    // For now, return the original image as placeholder
    return {
      finalImage: mapImage
    };
  }

  /**
   * Convert GPS points to pixel coordinates
   */
  static gpsToPixelCoordinates(
    gpsPoints: LatLng[],
    imageBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number,
    zoom: number
  ): PixelPoint[] {
    return gpsPoints.map(point => 
      MercatorUtil.latLngToPixel(point, imageBounds, imageWidth, imageHeight, zoom)
    );
  }

  /**
   * Validate pixel points are within image bounds
   */
  static validatePixelPoints(
    pixelPoints: PixelPoint[],
    imageWidth: number,
    imageHeight: number
  ): void {
    for (let i = 0; i < pixelPoints.length; i++) {
      const point = pixelPoints[i];
      
      if (point.x < 0 || point.x > imageWidth) {
        console.warn(`GPS point ${i} X coordinate ${point.x} is outside image bounds (0-${imageWidth})`);
      }
      
      if (point.y < 0 || point.y > imageHeight) {
        console.warn(`GPS point ${i} Y coordinate ${point.y} is outside image bounds (0-${imageHeight})`);
      }
    }
  }

  /**
   * Calculate trajectory bounding box in pixel coordinates
   */
  static calculateTrajectoryPixelBounds(pixelPoints: PixelPoint[]): PixelBounds {
    if (pixelPoints.length === 0) {
      throw new Error('Cannot calculate bounds from empty pixel points');
    }

    let minX = pixelPoints[0].x;
    let maxX = pixelPoints[0].x;
    let minY = pixelPoints[0].y;
    let maxY = pixelPoints[0].y;

    for (const point of pixelPoints) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Apply line style configuration
   */
  static applyLineStyle(config: {
    color: string;
    width: number;
    opacity?: number;
    dashPattern?: number[];
  }): any {
    // In a real implementation, this would return canvas/graphics context styling
    // For now, return the config as-is
    return {
      strokeStyle: config.color,
      lineWidth: config.width,
      globalAlpha: config.opacity || 1.0,
      lineDash: config.dashPattern || []
    };
  }

  /**
   * Draw trajectory path on canvas context
   */
  static drawTrajectoryPath(
    pixelPoints: PixelPoint[],
    context: any, // Canvas context or similar
    lineStyle: any
  ): void {
    if (pixelPoints.length < 2) {
      return; // Need at least 2 points to draw a line
    }

    // Apply line style
    Object.assign(context, lineStyle);

    // Begin path
    context.beginPath();
    context.moveTo(pixelPoints[0].x, pixelPoints[0].y);

    // Draw lines to each subsequent point
    for (let i = 1; i < pixelPoints.length; i++) {
      context.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    }

    // Stroke the path
    context.stroke();
  }
}