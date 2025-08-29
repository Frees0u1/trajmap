import { Canvas, createCanvas, loadImage } from 'canvas';
import { RenderResult, PixelPoint, LatLng, GeoBounds, ProjectionResult, TrackRegion, ExpansionRegion, TrajmapConfig } from '../types';
import { MercatorUtil } from '../utils/mercator';

/**
 * Render class for handling final image output and formatting
 */
export class RenderService {
  /**
   * Convert projection result to final render result
   * @param projectionResult - The projection result containing image and metadata
   * @param trackRegion - Track region configuration for output dimensions
   * @param expansionRegion - Optional expansion region configuration
   * @returns RenderResult with base64 image and pixel coordinates
   */
  static async formatResult(
    projectionResult: ProjectionResult,
    config: TrajmapConfig,
    zoom: number,
  ): Promise<RenderResult> {
    // Calculate final output dimensions based on trackRegion and expansion
    const { finalWidth, finalHeight } = this.calculateOutputDimensions(
      config.trackRegion,
      config.expansionRegion
    );
    
    // Resize the projected image to match output dimensions
    const resizedImage = await this.resizeImage(
      projectionResult.finalImage,
      finalWidth,
      finalHeight
    );
    
    // Convert resized image to base64
    const base64Image = resizedImage.toString('base64');
    
    // Calculate scale factors for pixel coordinate conversion
    const scaleX = finalWidth / projectionResult.pixelBounds.maxX;
    const scaleY = finalHeight / projectionResult.pixelBounds.maxY;
    
    // Convert GPS coordinates to pixel coordinates based on output dimensions
    const pixelPoints: PixelPoint[] = projectionResult.gpsPoints.map(point => {
      const originalPixel = MercatorUtil.latLngToPixel(
        point,
        projectionResult.bounds,
        projectionResult.pixelBounds.maxX,
        projectionResult.pixelBounds.maxY,
        zoom,
        config.retina,
      );
      
      // Scale to output dimensions
      return {
        x: originalPixel.x * scaleX,
        y: originalPixel.y * scaleY
      };
    });
    
    return {
      data: base64Image,
      points: pixelPoints
    };
  }
  
  /**
   * Calculate output dimensions based on track region and expansion
   * @param trackRegion - Track region configuration
   * @param expansionRegion - Optional expansion region configuration
   * @returns Final width and height for output
   */
  private static calculateOutputDimensions(
    trackRegion: TrackRegion,
    expansionRegion?: ExpansionRegion
  ): { finalWidth: number; finalHeight: number } {
    let finalWidth = trackRegion.width;
    let finalHeight = trackRegion.height;
    
    if (expansionRegion) {
      // Apply expansion percentages
      const leftExpansion = expansionRegion.leftPercent || 0;
      const rightExpansion = expansionRegion.rightPercent || 0;
      const upExpansion = expansionRegion.upPercent || 0;
      const downExpansion = expansionRegion.downPercent || 0;
      
      finalWidth = Math.round(finalWidth * (1 + leftExpansion + rightExpansion));
      finalHeight = Math.round(finalHeight * (1 + upExpansion + downExpansion));
    }
    
    return { finalWidth, finalHeight };
  }
  
  /**
   * Resize image to target dimensions
   * @param imageBuffer - Original image buffer
   * @param targetWidth - Target width in pixels
   * @param targetHeight - Target height in pixels
   * @returns Resized image buffer
   */
  static async resizeImage(
    imageBuffer: Buffer,
    targetWidth: number,
    targetHeight: number
  ): Promise<Buffer> {
    // Load the original image
    const originalImage = await loadImage(imageBuffer);
    
    // Create target canvas with desired dimensions
    const targetCanvas = createCanvas(targetWidth, targetHeight);
    const targetCtx = targetCanvas.getContext('2d');
    
    // Draw the original image scaled to fit the target canvas
    targetCtx.drawImage(
      originalImage,
      0, 0, originalImage.width, originalImage.height,
      0, 0, targetWidth, targetHeight
    );
    
    return targetCanvas.toBuffer('image/png');
  }
  
  /**
   * Save render result to file
   * @param result - The render result to save
   * @param outputPath - Path to save the image file
   */
  static async saveToFile(result: RenderResult, outputPath: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert base64 back to buffer and save
    const imageBuffer = Buffer.from(result.data, 'base64');
    fs.writeFileSync(outputPath, imageBuffer);
    
    console.log(`✅ Image saved to: ${outputPath}`);
  }
}