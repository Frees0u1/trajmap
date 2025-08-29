/**
 * Tile calculation and fetching module
 * Handles tile coordinate calculation and tile data retrieval
 */

import { GeoBounds, TileCoord, TileData, TileGrid, TileResult } from '../types';
import { MercatorUtil } from '../utils/mercator';

/**
 * Tile service
 */
export class TileService {
  /**
   * Calculate required tiles for given bounds and zoom level
   */
  static calculateTiles(bounds: GeoBounds, zoom: number): TileResult {
    // Convert bounds to tile coordinates
    const topLeft = MercatorUtil.latLngToTile(
      { lat: bounds.maxLat, lng: bounds.minLng },
      zoom
    );
    const bottomRight = MercatorUtil.latLngToTile(
      { lat: bounds.minLat, lng: bounds.maxLng },
      zoom
    );

    const tiles: TileData[] = [];

    // Generate all tiles in the grid
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        const coord: TileCoord = { x, y, z: zoom };
        const tileBounds = MercatorUtil.tileToBounds(coord.x, coord.y, coord.z);
        
        tiles.push({
          coord,
          buffer: Buffer.alloc(0), // Will be filled by tile fetcher
          bounds: tileBounds
        });
      }
    }

    const tileGrid: TileGrid = {
      tiles,
      bounds,
      zoom
    };

    return {
      tileGrid,
      zoom
    };
  }

  /**
   * Get tile URL from CartoCD provider with retina support
   */
  static getTileUrl(coord: TileCoord, retina: boolean = true): string {
    const { x, y, z } = coord;
    const retinaParam = retina ? '@2x' : '';
    
    // Randomly select one of the four subdomains (a, b, c, d)
    const subdomains = ['a', 'b', 'c', 'd'];
    const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
    
    // Use CartoDB Voyager style with retina support and random subdomain
    return `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${retinaParam}.png`;
  }

  /**
   * Fetch tile data from URL
   */
  static async fetchTile(coord: TileCoord, retina: boolean = true): Promise<TileData> {
    const url = TileService.getTileUrl(coord, retina);
    
    try {
      // Note: In a real implementation, you would use fetch or axios here
      // For now, we'll return a placeholder
      const tileBounds = MercatorUtil.tileToBounds(coord.x, coord.y, coord.z);
      
      return {
        coord,
        buffer: Buffer.alloc(0), // Placeholder - would contain actual tile image data
        bounds: tileBounds
      };
    } catch (error) {
      throw new Error(`Failed to fetch tile ${coord.z}/${coord.x}/${coord.y}: ${error}`);
    }
  }

  /**
   * Fetch all tiles in a grid
   */
  static async fetchTileGrid(tileGrid: TileGrid, retina: boolean = true): Promise<TileGrid> {
    const fetchPromises = tileGrid.tiles.map(tile => 
      TileService.fetchTile(tile.coord, retina)
    );

    try {
      const fetchedTiles = await Promise.all(fetchPromises);
      
      return {
        ...tileGrid,
        tiles: fetchedTiles
      };
    } catch (error) {
      throw new Error(`Failed to fetch tile grid: ${error}`);
    }
  }

  /**
   * Validate tile coordinate
   */
  static validateTileCoord(coord: TileCoord): boolean {
    const maxTile = Math.pow(2, coord.z) - 1;
    
    return coord.x >= 0 && coord.x <= maxTile &&
           coord.y >= 0 && coord.y <= maxTile &&
           coord.z >= 0 && coord.z <= 18; // Max zoom level
  }
}