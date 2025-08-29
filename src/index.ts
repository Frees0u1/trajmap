/**
 * TrajMap - GPS Trajectory Map Rendering Library
 * Main entry point
 */

// Export all types
export * from './types';

// Export all services
export { PreprocessingService } from './preprocessing';
export { BoundaryService } from './boundary';
export { TileService } from './tiles';
export { StitchingService } from './stitching';
export { ProjectionService } from './projection';

// Export utilities
export { MercatorUtil } from './utils/mercator';
export { GeoUtil } from './utils/geo';
export { PolylineUtil } from './utils/polyline';

// Main rendering pipeline
import { RenderConfig, ProjectionResult } from './types';
import { PreprocessingService } from './preprocessing';
import { BoundaryService } from './boundary';
import { TileService } from './tiles';
import { StitchingService } from './stitching';
import { ProjectionService } from './projection';

/**
 * Main TrajMap class
 */
export class TrajMap {
  /**
   * Render GPS trajectory to map image
   */
  static async render(config: RenderConfig): Promise<ProjectionResult> {
    try {
      // Step 1: Preprocessing - decode polyline and validate config
      const preprocessingResult = PreprocessingService.process(config);
      const { gpsPoints, config: processedConfig } = preprocessingResult;

      // Step 2: Boundary determination - calculate bounds and zoom
      const boundaryResult = BoundaryService.calculateBounds(
        gpsPoints,
        processedConfig.trackRegion,
        processedConfig.expansionRegion
      );
      const { bounds, zoom } = boundaryResult;

      // Step 3: Tile calculation - determine required tiles
      const tileResult = TileService.calculateTiles(bounds, zoom);
      const { tileGrid } = tileResult;

      // Step 4: Tile fetching - get tile data
      const fetchedTileGrid = await TileService.fetchTileGrid(
        tileGrid,
        processedConfig.tileProvider || 'osm'
      );

      // Step 5: Stitching and cropping - create base map image
      const stitchingResult = StitchingService.stitchAndCrop(
        fetchedTileGrid,
        bounds,
        processedConfig.trackRegion
      );
      const { image: mapImage } = stitchingResult;

      // Step 6: Trajectory projection - draw GPS path on map
      const projectionResult = ProjectionService.projectTrajectory(
        gpsPoints,
        mapImage,
        bounds,
        processedConfig.trackRegion,
        processedConfig.lineColor,
        processedConfig.lineWidth
      );

      return projectionResult;
    } catch (error) {
      throw new Error(`TrajMap rendering failed: ${error}`);
    }
  }

  /**
   * Validate configuration before rendering
   */
  static validateConfig(config: RenderConfig): void {
    PreprocessingService.validateConfig(config);
  }

  /**
   * Get supported tile providers
   */
  static getSupportedProviders(): string[] {
    return ['osm', 'openstreetmap', 'google', 'google-satellite'];
  }

  /**
   * Get library version
   */
  static getVersion(): string {
    return '1.0.0';
  }
}