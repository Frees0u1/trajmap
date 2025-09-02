# TrajMap

A high-performance GPS trajectory rendering library that transforms Polyline-encoded route data into beautiful PNG images with map tile backgrounds.

## Features

- 🗺️ **Map Tile Integration**: Seamlessly fetches and stitches OpenStreetMap tiles as backgrounds
- 🛣️ **Polyline Decoding**: Native support for Google Polyline encoded trajectory data
- 🎨 **Customizable Styling**: Configure trajectory colors, line widths, and marker points
- 📐 **Intelligent Boundary Calculation**: Automatically determines optimal display regions and zoom levels
- 🎯 **Precise Projection**: Leverages Web Mercator projection for accurate geographic coordinate mapping
- 🖼️ **High-Quality Output**: Supports Retina displays and PNG format export
- 📦 **Modular Architecture**: Individual processing modules can be used independently

## How It Works

### Rendering Pipeline

TrajMap employs a sophisticated multi-stage rendering pipeline to ensure high-quality map visualization:

```
Polyline Input → Preprocessing → Boundary Calculation → Tile Fetching → Image Stitching → Trajectory Projection → Final Rendering
```

#### 1. Preprocessing Stage
- Decodes Google Polyline format data into GPS coordinate points
- Validates configuration parameters
- Prepares data structures for subsequent processing

#### 2. Boundary Calculation
- Computes the minimum bounding box for the trajectory
- Applies a 10% buffer zone to prevent edge clipping
- Adjusts aspect ratio based on trackRegion specifications
- Applies expansionRegion for area extension

#### 3. Tile Fetching
- Calculates optimal zoom level based on boundaries and target dimensions
- Determines required tile coordinate ranges
- Downloads OpenStreetMap tiles in parallel
- Handles tile caching and error retry logic

#### 4. Image Stitching
- Combines multiple tiles into a complete background image
- Manages tile boundary alignment
- Calculates final image geographic boundaries

#### 5. Trajectory Projection
- Uses Web Mercator projection to convert GPS coordinates to pixel coordinates
- Renders trajectory paths and marker points
- Applies custom styling (colors, line widths, etc.)

#### 6. Final Rendering
- Generates the final PNG image
- Supports Base64 encoded output
- Returns trajectory point pixel coordinate information

### Coordinate Systems

- **Input Coordinates**: WGS84 Geographic Coordinate System (lat/lng)
- **Projection Coordinates**: Web Mercator Projection (EPSG:3857)
- **Tile Coordinates**: Standard tile pyramid coordinate system
- **Pixel Coordinates**: Final image pixel coordinate system

## Installation

```bash
npm install trajmap
```

### System Requirements

- Node.js >= 14.0.0
- Canvas-compatible system environment (canvas dependency auto-installed)

## Quick Start

### Basic Usage

```typescript
import { TrajMap } from 'trajmap';

// Simple configuration
const result = await TrajMap.render(
  'your_encoded_polyline_string',
  {
    trackRegion: {
      width: 800,
      height: 600
    }
  }
);

console.log('Rendering complete!');
```

### Complete Configuration Example

```typescript
import { TrajMap, TrajmapConfig } from 'trajmap';

const polyline = 'u{~vFvyys@fS]z@cNpKoMdQaHbU{FzV}L';

const config: TrajmapConfig = {
  // Required parameters
  trackRegion: {
    width: 1200,
    height: 800
  },
  
  // Optional parameters
  lineColor: '#FF5500',      // Trajectory color
  lineWidth: 4,              // Trajectory line width
  retina: true,              // High-resolution rendering
  
  // Region expansion configuration
  expansionRegion: {
    upPercent: 0.2,          // Expand upward by 20%
    downPercent: 0.2,        // Expand downward by 20%
    leftPercent: 0.1,        // Expand leftward by 10%
    rightPercent: 0.1        // Expand rightward by 10%
  },
  
  // Marker point configuration
  marker: {
    start: 'circle',         // Start point marker: circle
    end: 'square'            // End point marker: square
  }
};

const result = await TrajMap.render(polyline, config);

// Access result information
console.log('Base64 image data:', result.data);
console.log('Trajectory pixel coordinates:', result.points);
```

## Links

- GitHub: [Frees0u1/trajmap](https://github.com/Frees0u1/trajmap)
