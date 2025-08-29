/**
 * Stitching and cropping module
 * Handles tile stitching and image cropping
 */

import { GeoBounds, PixelBounds, TileGrid, TrackRegion, StitchingResult, TileCoord } from '../types';
import { MercatorUtil } from '../utils/mercator';
import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';

/**
 * Stitching service
 */
export class StitchingService {
  /**
   * Stitch tiles into a single image and crop to target region
   */
  static async stitchAndCrop(
    tileGrid: TileGrid,
    zoom: number,
    retina: boolean = false
  ): Promise<StitchingResult> {
    // Calculate the actual tile grid dimensions
    const coords = tileGrid.tiles.map(t => t.coord);
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));
    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    
    const tileSize = MercatorUtil.getTileSize(retina);
    const fullWidth = cols * tileSize;
    const fullHeight = rows * tileSize;

    // Calculate pixel bounds for the target region within the full image
    const pixelBounds = MercatorUtil.geoBoundsToPixelBounds(
      tileGrid.targetBounds,
      tileGrid.tileBounds,
      fullWidth,
      fullHeight,
      zoom
    );



    // Validate pixel bounds
    StitchingService.validatePixelBounds(pixelBounds, fullWidth, fullHeight);

    // Create full canvas for stitching
    const fullCanvas = createCanvas(fullWidth, fullHeight);
    const fullCtx = fullCanvas.getContext('2d');
    
    // Fill background
    fullCtx.fillStyle = '#f0f0f0';
    fullCtx.fillRect(0, 0, fullWidth, fullHeight);
    
    // Stitch all tiles
    for (const tileData of tileGrid.tiles) {
      const tile = tileData.coord;
      const col = tile.x - minX;
      const row = tile.y - minY;
      const x = col * tileSize;
      const y = row * tileSize;
      
      try {
        if (tileData.buffer && tileData.buffer.length > 0) {
          const image = await loadImage(tileData.buffer);
          fullCtx.drawImage(image, x, y, tileSize, tileSize);
        } else {
          // Draw placeholder
          StitchingService.drawTilePlaceholder(fullCtx, x, y, tileSize, tileSize, tile);
        }
      } catch (error) {
        // Draw placeholder on error
        StitchingService.drawTilePlaceholder(fullCtx, x, y, tileSize, tileSize, tile);
      }
    }
    
    // Crop to target region
    const cropWidth = pixelBounds.maxX - pixelBounds.minX;
    const cropHeight = pixelBounds.maxY - pixelBounds.minY;
    
    // Create cropped canvas
    const croppedCanvas = createCanvas(cropWidth, cropHeight);
    const croppedCtx = croppedCanvas.getContext('2d');
    
    // Draw cropped region from full canvas
    croppedCtx.drawImage(
      fullCanvas,
      pixelBounds.minX, pixelBounds.minY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    return {
      image: croppedCanvas.toBuffer('image/png'),
      bounds: tileGrid.targetBounds,
      pixelBounds
    };
  }

  /**
   * Draw tile placeholder when tile image is not available
   */
  static drawTilePlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    tile: TileCoord
  ): void {
    // Draw background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x, y, width, height);
    
    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Draw tile info
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${tile.z}/${tile.x}/${tile.y}`, x + width/2, y + height/2 - 5);
    ctx.fillText('No Image', x + width/2, y + height/2 + 10);
  }

  /**
   * Calculate tile positions in the stitched image
   */
  static calculateTilePositions(tileGrid: TileGrid, retina: boolean = false): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const tileSize = MercatorUtil.getTileSize(retina);

    // Find the minimum tile coordinates to use as origin
    let minX = Infinity;
    let minY = Infinity;
    
    for (const tile of tileGrid.tiles) {
      minX = Math.min(minX, tile.coord.x);
      minY = Math.min(minY, tile.coord.y);
    }

    // Calculate position for each tile
    for (const tile of tileGrid.tiles) {
      const key = `${tile.coord.x}-${tile.coord.y}-${tile.coord.z}`;
      const x = (tile.coord.x - minX) * tileSize;
      const y = (tile.coord.y - minY) * tileSize;
      
      positions.set(key, { x, y });
    }

    return positions;
  }

  /**
   * Validate pixel bounds
   */
  static validatePixelBounds(
    pixelBounds: PixelBounds,
    imageWidth: number,
    imageHeight: number
  ): void {
    if (pixelBounds.minX < 0 || pixelBounds.maxX > imageWidth) {
      throw new Error(`Invalid X bounds: ${pixelBounds.minX}-${pixelBounds.maxX} for image width ${imageWidth}`);
    }

    if (pixelBounds.minY < 0 || pixelBounds.maxY > imageHeight) {
      throw new Error(`Invalid Y bounds: ${pixelBounds.minY}-${pixelBounds.maxY} for image height ${imageHeight}`);
    }

    if (pixelBounds.minX >= pixelBounds.maxX) {
      throw new Error('Invalid X bounds: min must be less than max');
    }

    if (pixelBounds.minY >= pixelBounds.maxY) {
      throw new Error('Invalid Y bounds: min must be less than max');
    }
  }

  /**
   * Calculate crop region from bounds
   */
  static calculateCropRegion(
    targetBounds: GeoBounds,
    imageBounds: GeoBounds,
    imageWidth: number,
    imageHeight: number,
    zoom: number
  ): PixelBounds {
    return MercatorUtil.geoBoundsToPixelBounds(
      targetBounds,
      imageBounds,
      imageWidth,
      imageHeight,
      zoom
    );
  }

  /**
   * Resize image to target dimensions
   */
  static resizeImage(
    imageBuffer: Buffer,
    currentWidth: number,
    currentHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Buffer {
    // In a real implementation, this would use a library like Sharp or Canvas
    // to resize the image buffer
    
    // For now, return a placeholder buffer of the target size
    return Buffer.alloc(targetWidth * targetHeight * 4); // RGBA
  }
}