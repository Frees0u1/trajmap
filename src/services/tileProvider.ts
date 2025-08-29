import axios from 'axios';
import { TileProvider } from '../types';

/**
 * Tile Service
 * Used for handling map tile retrieval and management
 */
export class TileService {
  /**
   * Default tile provider list
   */
  private static readonly providers: Record<string, TileProvider> = {
    // OpenStreetMap
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    },
    // CARTO Voyager
    carto: {
      url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      attribution: '© CARTO, © OpenStreetMap contributors',
      maxZoom: 20
    }
  };

  /**
   * Get tile URL
   * @param provider Tile provider name or configuration
   * @param x Tile X coordinate
   * @param y Tile Y coordinate
   * @param z Zoom level
   * @returns Tile URL
   */
  static getTileUrl(provider: string | TileProvider, x: number, y: number, z: number): string {
    const tileProvider = typeof provider === 'string' 
      ? this.getProvider(provider) 
      : provider;
    
    return tileProvider.url
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{z}', z.toString());
  }

  /**
   * Get tile image data
   * @param provider Tile provider name or configuration
   * @param x Tile X coordinate
   * @param y Tile Y coordinate
   * @param z Zoom level
   * @returns Promise<Buffer> Tile image data
   */
  static async getTileImage(
    provider: string | TileProvider, 
    x: number, 
    y: number, 
    z: number
  ): Promise<Buffer> {
    const url = this.getTileUrl(provider, x, y, z);
    
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve tile';
      throw new Error(`Failed to retrieve tile: ${errorMessage}`);
    }
  }

  /**
   * Get tile provider configuration
   * @param name Tile provider name
   * @returns TileProvider Tile provider configuration
   */
  static getProvider(name: string): TileProvider {
    if (!this.providers[name]) {
      throw new Error(`Unknown tile provider: ${name}`);
    }
    return this.providers[name];
  }
}