# TrajMap

Render Polyline trajectories as PNG images with map tile backgrounds.

## Features

- Support for decoding and processing Polyline format trajectory data
- Map tiles as background
- Customizable trajectory styles and rendering parameters
- High-quality PNG image output
- Available as both CLI tool and API

## Installation

```bash
npm install trajmap
```

## Usage

### Command Line

```bash
# Basic usage
trajmap --polyline "encoded_polyline_string" --output trajectory.png

# With parameters
trajmap --polyline "encoded_polyline_string" --output trajectory.png --width 800 --height 600 --line-color "#FF5500" --line-width 3
```

### API

```typescript
import { renderTrajectory } from 'trajmap';

// Render trajectory
await renderTrajectory({
  polyline: 'encoded_polyline_string',
  output: 'trajectory.png',
  width: 800,
  height: 600,
  lineColor: '#FF5500',
  lineWidth: 3
});
```

## License

MIT