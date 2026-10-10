# TrajMap

[![npm version](https://img.shields.io/npm/v/trajmap.svg)](https://www.npmjs.com/package/trajmap)
[![license](https://img.shields.io/npm/l/trajmap.svg)](./LICENSE)

Render GPS routes as PNG map images in Node.js. Give it an encoded polyline (e.g. the `map.summary_polyline` of a Strava activity) and get back a static map image with the route drawn on a real basemap — no browser or headless Chrome needed.

<p>
  <img src="https://raw.githubusercontent.com/Frees0u1/trajmap/main/docs/images/central-park.png" alt="Route around Central Park, New York, rendered by trajmap" width="49%">
  <img src="https://raw.githubusercontent.com/Frees0u1/trajmap/main/docs/images/marina-bay.png" alt="Route around Marina Bay, Singapore, rendered by trajmap" width="49%">
</p>

Useful for activity thumbnails, dashboards, social share cards, emails and anywhere you need a static route map image on the server.

## Before You Start

- **CARTO API key (required for the default basemap).** Get one free at <https://carto.com/basemaps/apikey> and set `CARTO_API_KEY`, or pass `tiles.apiKey`. Without it every tile renders as "API KEY REQUIRED". See [Map Tiles & API Key](#map-tiles--api-key).
- **Native `canvas` dependency.** trajmap draws with [node-canvas](https://github.com/Automattic/node-canvas). Prebuilt binaries cover most platforms; on others (e.g. Alpine Linux, some ARM images) you need the system libraries listed in the [node-canvas install guide](https://github.com/Automattic/node-canvas#compiling).

## Features

- 🗺️ **Map Tile Integration**: Seamlessly fetches and stitches CARTO basemap tiles as backgrounds (custom tile providers supported)
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
- Downloads basemap tiles (CARTO Voyager by default) in parallel
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

  // Tile provider configuration
  tiles: {
    apiKey: process.env.CARTO_API_KEY  // CARTO basemaps API key
  },
  
  // Region expansion configuration: extra map area beyond the track region.
  // At most one direction may be set.
  expansionRegion: {
    downPercent: 0.2         // Expand downward by 20%
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

## Map Tiles & API Key

The default basemap is [CARTO Voyager](https://carto.com/basemaps), which **requires an API key**.
Without one, every tile renders as an "API KEY REQUIRED" placeholder. Get a key at
<https://carto.com/basemaps/apikey>, then either:

- set the `CARTO_API_KEY` environment variable (picked up automatically), or
- pass it per render via `config.tiles.apiKey` (takes precedence over the environment variable).

To use another tile provider, pass `config.tiles.urlTemplate` with these placeholders:
`{s}` subdomain (a–d), `{z}` `{x}` `{y}` tile coordinates, `{r}` retina suffix (`@2x` or empty),
`{key}` the URL-encoded `apiKey`. The key is only appended automatically for the default CARTO URL.

```typescript
await TrajMap.render(polyline, {
  trackRegion: { width: 800, height: 600 },
  tiles: {
    urlTemplate: 'https://tiles.example.com/{z}/{x}/{y}{r}.png?token={key}',
    apiKey: 'YOUR_TOKEN'
  }
});
```

## Links

- GitHub: [Frees0u1/trajmap](https://github.com/Frees0u1/trajmap)
