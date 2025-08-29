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
import { TrajmapConfig, RenderResult, LatLng, GeoBounds, PixelPoint } from './types';
import { PreprocessingService } from './preprocessing';
import { BoundaryService } from './boundary';
import { TileService } from './tiles';
import { StitchingService } from './stitching';
import { ProjectionService } from './projection';
import { RenderService } from './render';
import { MercatorUtil } from './utils/mercator';

/**
 * Main TrajMap class
 */
export class TrajMap {
  /**
   * Render GPS trajectory to map image
   */
  static async render(config: TrajmapConfig): Promise<RenderResult> {
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
      const { bounds } = boundaryResult;

      const zoom = TileService.calculateOptimalZoom(bounds);
      // Step 3: Tile calculation - determine required tiles
      const tileResult = TileService.calculateTiles(bounds, zoom);
      const { tileGrid } = tileResult;

      // Step 4: Tile fetching - get tile data
      const fetchedTileGrid = await TileService.fetchTileGrid(
        tileGrid,
        processedConfig.retina || false
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
      let targetWidth = processedConfig.trackRegion.width;
      let targetHeight = processedConfig.trackRegion.height;
      
      if (processedConfig.expansionRegion) {
        const expansion = processedConfig.expansionRegion;
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
        processedConfig.lineColor || '#FF5500',
        processedConfig.lineWidth || 3
      );

      // Step 7: Format final result using RenderService
      return await RenderService.formatResult(
        projectionResult.finalImage,
        preprocessingResult.gpsPoints,
        stitchingResult.bounds,
        targetWidth,
        targetHeight,
        tileResult.zoom,
        processedConfig.retina || false
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

  /**
   * Get library version
   */
  static getVersion(): string {
    return '1.0.0';
  }
}