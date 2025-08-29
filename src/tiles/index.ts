/**
 * Tile calculation and fetching module
 * Handles tile coordinate calculation and tile data retrieval
 */

import axios from 'axios';
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

    // Calculate the actual bounds of the tile grid
    const topLeftTileBounds = MercatorUtil.tileToBounds(topLeft.x, topLeft.y, zoom);
    const bottomRightTileBounds = MercatorUtil.tileToBounds(bottomRight.x, bottomRight.y, zoom);
    
    const tileBounds: GeoBounds = {
      minLat: bottomRightTileBounds.minLat,
      maxLat: topLeftTileBounds.maxLat,
      minLng: topLeftTileBounds.minLng,
      maxLng: bottomRightTileBounds.maxLng
    };

    const tileGrid: TileGrid = {
      tiles,
      targetBounds: bounds,
      tileBounds,
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
  static getTileUrl(coord: TileCoord, retina: boolean = false): string {
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
  static async fetchTile(coord: TileCoord, retina: boolean = false): Promise<TileData> {
    const url = TileService.getTileUrl(coord, retina);
    
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const tileBounds = MercatorUtil.tileToBounds(coord.x, coord.y, coord.z);
      
      return {
        coord,
        buffer,
        bounds: tileBounds
      };
    } catch (error) {
      throw new Error(`Failed to fetch tile ${coord.z}/${coord.x}/${coord.y}: ${error}`);
    }
  }

  /**
   * Fetch all tiles in a grid
   */
  static async fetchTileGrid(tileGrid: TileGrid, retina: boolean = false): Promise<TileGrid> {
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
   * Calculate optimal zoom level for given bounds using Web Mercator projection
   * Based on standard tile-based mapping algorithms
   */
  static calculateOptimalZoom(bounds: GeoBounds, viewportWidth: number = 1024, viewportHeight: number = 768): number {
    // Use Web Mercator formula to calculate zoom level
    // Based on the longitude span and viewport width
    const lngSpan = bounds.maxLng - bounds.minLng;
    
    // Calculate zoom level based on longitude span
    // At zoom 0, the world is 360 degrees wide and 256 pixels wide
    // At zoom n, the world is 256 * 2^n pixels wide
    const zoomForLng = Math.log2(viewportWidth * 360 / (lngSpan * 256));
    
    // For latitude, we need to account for Mercator projection distortion
    // Convert latitude bounds to Web Mercator Y coordinates
    const latRad1 = (bounds.minLat * Math.PI) / 180;
    const latRad2 = (bounds.maxLat * Math.PI) / 180;
    
    // Web Mercator Y calculation
    const mercY1 = Math.log(Math.tan(Math.PI / 4 + latRad1 / 2));
    const mercY2 = Math.log(Math.tan(Math.PI / 4 + latRad2 / 2));
    const mercYSpan = Math.abs(mercY2 - mercY1);
    
    // Calculate zoom level for latitude
    // The full Mercator Y range is 2π, and at zoom 0 it's 256 pixels
    const zoomForLat = Math.log2(viewportHeight * 2 * Math.PI / (mercYSpan * 256));
    
    // Use the smaller zoom level to ensure the entire bounds fit
    const zoom = Math.floor(Math.min(zoomForLng, zoomForLat));
    
    // Clamp zoom level to valid range
    return Math.min(Math.max(zoom, 1), 18);
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