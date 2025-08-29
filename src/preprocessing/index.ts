/**
 * Preprocessing module
 * Handles polyline decoding and configuration setup
 */

import { LatLng, TrajmapConfig, PreprocessingResult } from '../types';
import { PolylineUtil } from '../utils/polyline';
import { ValidationUtil } from '../utils/validation';

/**
 * Preprocessing service
 */
export class PreprocessingService {
  /**
   * Process input polyline and configuration
   * @param polyline - Encoded polyline string
   * @param config - Rendering configuration
   */
  static process(polyline: string, config: TrajmapConfig): PreprocessingResult {
    // Validate polyline
    if (!PolylineUtil.validate(polyline)) {
      throw new Error('Invalid polyline format');
    }

    // Decode polyline to GPS points
    const gpsPoints = PolylineUtil.decode(polyline);
    
    if (gpsPoints.length === 0) {
      throw new Error('No GPS points found in polyline');
    }

    // Validate expansion region if provided
    if (config.expansionRegion) {
      ValidationUtil.validateExpansionRegion(config.expansionRegion);
    }

    // Apply default configuration (no default expansion region)
    const processedConfig: TrajmapConfig = {
      ...config,
      lineColor: config.lineColor || '#FF0000',
      lineWidth: config.lineWidth || 3,
      retina: config.retina !== undefined ? config.retina : false
    };

    return {
      gpsPoints,
      config: processedConfig
    };
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: TrajmapConfig): void {
    if (!config.trackRegion) {
      throw new Error('Track region is required');
    }

    if (config.trackRegion.width <= 0 || config.trackRegion.height <= 0) {
      throw new Error('Track region dimensions must be positive');
    }

    if (!config.output) {
      throw new Error('Output path is required');
    }
  }
}