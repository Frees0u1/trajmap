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
  upPercent?: number;    // percentage (0-1)
  downPercent?: number;  // percentage (0-1)
  leftPercent?: number;  // percentage (0-1)
  rightPercent?: number; // percentage (0-1)
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
  targetBounds: GeoBounds;  
  tileBounds: GeoBounds;
  zoom: number;
}

// Rendering configuration
export interface TrajmapConfig {
  trackRegion: TrackRegion;
  expansionRegion?: ExpansionRegion;
  lineColor?: string;
  lineWidth?: number;
  retina?: boolean;
  marker?: {
    start?: string; // 'circle', 'square', 'triangle'
    end?: string;   // 'circle', 'square', 'triangle'
  };
}

// Processing result interfaces
export interface PreprocessingResult {
  gpsPoints: LatLng[];
  config: TrajmapConfig;
}

export interface HistoryBounds {
  step1InitBound: GeoBounds;      // Initial trajectory bounds
  step2BufferBound: GeoBounds;    // 10% buffer bounds
  step3TrackBound: GeoBounds;     // Track region adjusted bounds
  step4ExpansionBound: GeoBounds; // Final expansion bounds
}

export interface BoundaryResult {
  bounds: GeoBounds;        // Final boundary box
  historyBounds: HistoryBounds;
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
  gpsPoints: LatLng[];
  bounds: GeoBounds;
  pixelBounds: PixelBounds;
}

export interface RenderResult {
  data: string; // base64 encoded image
  points: PixelPoint[]; // trajectory points in pixel coordinates
}