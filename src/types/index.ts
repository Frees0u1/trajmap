/**
 * Coordinate point interface
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Rendering configuration options
 */
export interface RenderOptions {
  // Input
  polyline: string;
  
  // Output
  output: string;
  
  // Image dimensions
  width: number;
  height: number;
  
  // Trajectory style
  lineColor: string;
  lineWidth: number;
  
  // Map configuration
  zoom?: number;
  tileProvider?: string;
  padding?: number;
  
  // Other options
  fitBounds?: boolean;
  showMarkers?: boolean;
  markerColor?: string;
}

/**
 * Map tile provider configuration
 */
export interface TileProvider {
  url: string;
  attribution: string;
  maxZoom: number;
}

/**
 * Map boundaries
 */
export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}