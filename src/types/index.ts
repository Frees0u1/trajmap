/**
 * Core data types for TrajMap
 */

// GPS coordinate point
export interface LatLng {
  lat: number;
  lng: number;
}

// Geographic boundary
export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Pixel coordinate
export interface PixelPoint {
  x: number;
  y: number;
}

// Pixel boundary
export interface PixelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Track region configuration
export interface TrackRegion {
  width: number;
  height: number;
}

// Expansion region configuration
export interface ExpansionRegion {
  up?: number;    // percentage
  down?: number;  // percentage
  left?: number;  // percentage
  right?: number; // percentage
}

// Tile coordinate
export interface TileCoord {
  x: number;
  y: number;
  z: number; // zoom level
}

// Tile data
export interface TileData {
  coord: TileCoord;
  buffer: Buffer;
  bounds: GeoBounds;
}

// Tile grid information
export interface TileGrid {
  tiles: TileData[];
  bounds: GeoBounds;
  zoom: number;
}

// Rendering configuration
export interface RenderConfig {
  polyline: string;
  trackRegion: TrackRegion;
  expansionRegion?: ExpansionRegion;
  output: string;
  lineColor?: string;
  lineWidth?: number;
  tileProvider?: string;
}

// Processing result interfaces
export interface PreprocessingResult {
  gpsPoints: LatLng[];
  config: RenderConfig;
}

export interface BoundaryResult {
  bounds: GeoBounds;
  zoom: number;
}

export interface TileResult {
  tileGrid: TileGrid;
  zoom: number;
}

export interface StitchingResult {
  image: Buffer;
  bounds: GeoBounds;
  pixelBounds: PixelBounds;
}

export interface ProjectionResult {
  finalImage: Buffer;
}