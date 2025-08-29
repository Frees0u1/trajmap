#!/usr/bin/env node

import { Command } from 'commander';
import { renderTrajectory } from './index';
import path from 'path';
import fs from 'fs';

// Get package information
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

const program = new Command();

program
  .name('trajmap')
  .description('Render Polyline trajectories as PNG images with map tile backgrounds')
  .version(packageJson.version);

program
  .requiredOption('-p, --polyline <string>', 'Trajectory string encoded in Polyline format')
  .requiredOption('-o, --output <path>', 'Output image path')
  .option('-w, --width <number>', 'Image width', '800')
  .option('-h, --height <number>', 'Image height', '600')
  .option('-c, --line-color <color>', 'Trajectory line color', '#FF5500')
  .option('-t, --line-width <number>', 'Trajectory line width', '3')
  .option('-z, --zoom <number>', 'Map zoom level')
  .option('-m, --tile-provider <provider>', 'Map tile provider', 'osm')
  .option('--padding <number>', 'Padding', '50')
  .option('--fit-bounds', 'Auto-fit trajectory bounds', true)
  .option('--show-markers', 'Show start and end markers', true)
  .option('--marker-color <color>', 'Marker color', '#FF0000')
  .action(async (options) => {
    try {
      // Convert numeric parameters
      const width = parseInt(options.width, 10);
      const height = parseInt(options.height, 10);
      const lineWidth = parseInt(options.lineWidth, 10);
      const padding = parseInt(options.padding, 10);
      const zoom = options.zoom ? parseInt(options.zoom, 10) : undefined;

      console.log('Starting trajectory rendering...');
      
      await renderTrajectory({
        polyline: options.polyline,
        output: options.output,
        width,
        height,
        lineColor: options.lineColor,
        lineWidth,
        zoom,
        tileProvider: options.tileProvider,
        padding,
        fitBounds: options.fitBounds,
        showMarkers: options.showMarkers,
        markerColor: options.markerColor
      });
      
      console.log(`Trajectory successfully rendered to: ${options.output}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Rendering failed:', errorMessage);
      process.exit(1);
    }
  });

program.parse(process.argv);