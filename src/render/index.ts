import { Canvas, createCanvas, loadImage } from 'canvas';
import { RenderResult, PixelPoint, LatLng, GeoBounds } from '../types';
import { MercatorUtil } from '../utils/mercator';

/**
 * Render class for handling final image output and formatting
 */
export class RenderService {
  /**
   * Convert projection result to final render result
   * @param finalImage - The projected image buffer
   * @param polylinePoints - Original GPS coordinates of the trajectory
   * @param bounds - Geographic bounds of the image
   * @param imageWidth - Width of the image in pixels
   * @param imageHeight - Height of the image in pixels
   * @param zoom - Zoom level used for the map
   * @param retina - Whether retina/high-DPI tiles were used
   * @returns RenderResult with base64 image and pixel coordinates
   */
  static async formatResult(
    finalImage: Buffer,
    polylinePoints: LatLng[],
    bounds: GeoBounds,
    imageWidth: number,
    imageHeight: number,
    zoom: number,
    retina: boolean = false
  ): Promise<RenderResult> {
    // Convert image buffer to base64
    const base64Image = finalImage.toString('base64');
    
    // Convert GPS coordinates to pixel coordinates
    const pixelPoints: PixelPoint[] = polylinePoints.map(point => {
      return MercatorUtil.latLngToPixel(
        point,
        bounds,
        imageWidth,
        imageHeight,
        zoom,
        retina
      );
    });
    
    return {
      data: base64Image,
      points: pixelPoints
    };
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