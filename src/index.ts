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
export { RenderService } from './render';

// Export utilities
export { MercatorUtil } from './utils/mercator';
export { GeoUtil } from './utils/geo';
export { PolylineUtil } from './utils/polyline';

// Main rendering pipeline
import { TrajmapConfig, RenderResult } from './types';
import { BoundaryService } from './boundary';
import { TileService } from './tiles';
import { StitchingService } from './stitching';
import { ProjectionService } from './projection';
import { RenderService } from './render';
import { MercatorUtil } from './utils/mercator';
import { PreprocessingService } from './preprocessing';

/**
 * Main TrajMap class
 */
export class TrajMap {
  /**
   * Render GPS trajectory to map image
   * @param polyline - Encoded polyline string representing GPS trajectory
   * @param config - Rendering configuration options
   */
  static async render(polyline: string, config: TrajmapConfig): Promise<RenderResult> {
    try {
      // Step 1: Preprocessing - decode polyline and validate config
      const preprocessingResult = PreprocessingService.process(polyline, config);
      const { gpsPoints, config: validatedConfig } = preprocessingResult;

      // Step 2: Boundary determination - calculate bounds and zoom
      const boundaryResult = BoundaryService.calculateBounds(
        gpsPoints,
        validatedConfig.trackRegion,
        validatedConfig.expansionRegion
      );
      const { bounds } = boundaryResult;

      const zoom = TileService.calculateOptimalZoom(bounds);
      // Step 3: Tile calculation - determine required tiles
      const tileResult = TileService.calculateTiles(bounds, zoom);
      const { tileGrid } = tileResult;

      // Step 4: Tile fetching - get tile data
      const fetchedTileGrid = await TileService.fetchTileGrid(
        tileGrid,
        validatedConfig.retina || false
      );

      // Step 5: Stitching and cropping - create base map image
      const stitchingResult = await StitchingService.stitchAndCrop(
        fetchedTileGrid,
        zoom
      );
      const { image: mapImage } = stitchingResult;

      // Step 6: Trajectory projection - draw GPS path on map
      const imageWidth = stitchingResult.pixelBounds.maxX - stitchingResult.pixelBounds.minX;
      const imageHeight = stitchingResult.pixelBounds.maxY - stitchingResult.pixelBounds.minY;
      
      // Calculate target dimensions based on trackRegion and expansionRegion
      let targetWidth = validatedConfig.trackRegion.width;
      let targetHeight = validatedConfig.trackRegion.height;
      
      if (validatedConfig.expansionRegion) {
        const expansion = validatedConfig.expansionRegion;
        const leftExpansion = (expansion.leftPercent || 0) * targetWidth;
        const rightExpansion = (expansion.rightPercent || 0) * targetWidth;
        const upExpansion = (expansion.upPercent || 0) * targetHeight;
        const downExpansion = (expansion.downPercent || 0) * targetHeight;
        
        targetWidth = Math.round(targetWidth + leftExpansion + rightExpansion);
        targetHeight = Math.round(targetHeight + upExpansion + downExpansion);
      }
      
      const projectionResult = await ProjectionService.projectTrajectory(
        preprocessingResult.gpsPoints,
        stitchingResult.image,
        stitchingResult.bounds,
        imageWidth,
        imageHeight,
        tileResult.zoom,
        validatedConfig
      );

      // Step 7: Format final result using RenderService
      return await RenderService.formatResult(
        projectionResult,
        validatedConfig,
        zoom
      );
    } catch (error) {
      throw new Error(`TrajMap rendering failed: ${error}`);
    }
  }

  /**
   * Validate configuration before rendering
   */
  static validateConfig(config: TrajmapConfig): void {
    PreprocessingService.validateConfig(config);
  }
}
