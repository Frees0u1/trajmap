/**
 * Trajectory projection module
 * Handles GPS trajectory projection onto map images
 */

import { LatLng, GeoBounds, PixelPoint, PixelBounds, TrackRegion, ProjectionResult, TrajmapConfig } from '../types';
import { MercatorUtil } from '../utils/mercator';
import { createCanvas, loadImage } from 'canvas';

/**
 * Projection service
 */
export class ProjectionService {
  /**
   * Project GPS trajectory onto map image
   */
  static async projectTrajectory(
    gpsPoints: LatLng[],
    mapImage: Buffer,
    mapBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number,
    zoom: number,
    config: TrajmapConfig
  ): Promise<ProjectionResult> {
    if (gpsPoints.length === 0) {
      throw new Error('No GPS points to project');
    }

    // Convert GPS points to pixel coordinates
    const pixelPoints = gpsPoints.map(point => 
      MercatorUtil.latLngToPixel(point, mapBounds, imageWidth, imageHeight, zoom)
    );

    // Validate pixel points are within image bounds
    ProjectionService.validatePixelPoints(pixelPoints, imageWidth, imageHeight);

    // Create canvas from map image
    const image = await loadImage(mapImage);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw background image
    ctx.drawImage(image, 0, 0);
    
    // Draw trajectory if we have at least 2 points
    if (pixelPoints.length >= 2) {
      ctx.strokeStyle = config.lineColor || '#FF5500';
      ctx.lineWidth = config.lineWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
      
      for (let i = 1; i < pixelPoints.length; i++) {
        ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
      }
      
      ctx.stroke();
      
      // Draw markers if specified
      if (config.marker?.start) {
        ProjectionService.drawMarker(ctx, pixelPoints[0], config.marker.start, 'start');
      }
      
      if (config.marker?.end) {
        ProjectionService.drawMarker(ctx, pixelPoints[pixelPoints.length - 1], config.marker.end, 'end');
      }
    }
    
    // Calculate pixel bounds for the trajectory
    const pixelBounds = ProjectionService.calculateTrajectoryPixelBounds(pixelPoints);
    
    return {
      finalImage: canvas.toBuffer('image/png'),
      gpsPoints: gpsPoints,
      bounds: mapBounds,
      pixelBounds: pixelBounds,
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

  /**
   * Draw marker at specified position
   */
  static drawMarker(
    ctx: any,
    point: PixelPoint,
    markerType: string,
    position: 'start' | 'end'
  ): void {
    const size = 12;
    
    // Draw geometric shape
    ctx.fillStyle = position === 'start' ? '#00CC00' : '#CC0000';
    
    switch (markerType.toLowerCase()) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - size / 2);
        ctx.lineTo(point.x - size / 2, point.y + size / 2);
        ctx.lineTo(point.x + size / 2, point.y + size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        // Default to circle
        ctx.beginPath();
        ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
  }
}