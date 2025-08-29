#!/usr/bin/env ts-node
/**
 * Stitching and cropping test script
 * Uses StitchingService and ProjectionService to implement tile stitching, cropping and trajectory projection
 */

import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Import project modules
import { PolylineUtil } from '../src/utils/polyline';
import { BoundaryService } from '../src/boundary';
import { TileService } from '../src/tiles';
import { StitchingService } from '../src/stitching';
import { ProjectionService } from '../src/projection';
import { MercatorUtil } from '../src/utils/mercator';
import { 
  LatLng, 
  GeoBounds, 
  TrackRegion, 
  TileCoord, 
  BoundaryResult, 
  ExpansionRegion,
  TileGrid,
  StitchingResult,
  ProjectionResult
} from '../src/types';

/**
 * Configuration parameters
 */
interface StitchTestConfig {
  polyline: string;
  outputPath: string;
  trackRegion: TrackRegion;
  expansion?: ExpansionRegion;
  lineColor?: string;
  lineWidth?: number;
}

/**
 * Default configuration
 */
const defaultConfig: StitchTestConfig = {
  // Example polyline
  polyline: '}t~FqypxRiEx@@sGmBAsCxMkGvMFxDfCnFtT`GbTpN~@iAzUqLpT_GnReNhq@{AdEoAhD_Ev@uDtBsz@hAeL~Vuh@j@uD]yNfA_G~_@ah@Wq@t@VdCyDyC|DwAmCoDiBMeJkCyFlIyCjEWo@eRx@kCgDiEtB}CKaFmOeBAkGo@gKyFg@cX{MlDiJiBm@qAgC{AIjIwQ|DuDc@`@dWgd@uSwLmEsFiAyKnDuMsB}GcKyN}PhO{O~J_WvJiLjCiAYk@gHvB{@eA}@V}DiAaHG{KrAkDnFqH}@sAb@oAgAcDmGqES_]bAwe@}F{t@{Ioe@cBaDiCmMQyHyLe^i@_H}BkE}H{_@a@qKuD}TmB{VgCkF@qHwCuFgY}cAI{Io@uKeS{o@{DqSsG_MxHcEmDmMCaEuDuTy@oh@}BoCsRgK`Pgb@|DaRp@PhCaFxXyz@dBoLmA{[pJgZG}MkBuDeFeDu\\{BemF_cBqN[oIlEcH`OaCnHVg@h@bAqQpi@gLjUoCjM_Ujr@c@A^kBkCBeAfEgLMsDyDaDzBq^lL{SdEyDjCsKzCuO`J_DxEuAbOgAnF}HfY|BpAzBdDxI|@f@YWiAhA[|@pCzCG_Axb@fC~JfDvF`InCrc@{@hGdArT~RDdAcFxFxKrKeS|RhHlIeE|EChBrIrEuDdHaCl[HzJ|@j@pBh[_@vHuCnKkKbUwPtVgRzULbAtMpFyNsD{JxRaYhMgPfSpFjG}TrScCo@gHvGqAWqB~AmLjQqIxHiAlGgDjHuPtPyFlQwPdDkGhI_ApEOtCn@~@fNJdJhDE|AiFxHkDzJQnR|TjUhJdSjG~DrTjBbSrG_@zCtA`@}BhFtD|CNpFgAbM|DnXY~NoQw@cLpDoHCmAu@eJjDcc@uDOhAtJpQtS`V~A~Da@rIeLrSaGeDwGa@mHiE{GaBoYx@_Io@uYkMmAt@dA|@kUtk@wJ~HbN`K_CjFfA|BZdHlKA`FqAlVpT_F`Fu@xELtBxGlEtBtEiCtNhFxRwDxMlo@vVGpAz@j@gDhPwPbXqA`FMtG~B`\\cIhYk@~FvB`LdCvFmBvJmCdCkCdHpBvSjQzx@hBlQ|FjWIzf@zEpYqCnw@yGnUpAxUtGt@zd@mArZlCv^hHz@rADlG|b@uDbWoLhT_PjBmEbGkCkCeG\\iApK_Dzh@{Fzf@sXxGYbMnBfReAhJwGfv@m\\lKgI~Af@dHsK|\\mUjZwBh^Cxe@{BpMsJ|J}BlJyEbLwIvNaQhn@cOsB~@}DuD{NkHsJoDmI}@gCiHEmCnFqNtBeO~AD',
  outputPath: './output/test-stitch.png',
  trackRegion: {
    width: 400,
    height: 200
  },
  // expansion: {
  //   rightPercent: 0.5,
  // },
  lineColor: '#FF5500',
  lineWidth: 3
};

/**
 * Stitching test class
 */
class StitchTester {
  private config: StitchTestConfig;
  private gpsPoints: LatLng[] = [];
  private boundaryResult!: BoundaryResult;
  private tileGrid!: TileGrid;
  private zoom!: number;
  private stitchingResult!: StitchingResult;
  private projectionResult!: ProjectionResult;

  constructor(config: StitchTestConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Run complete test workflow
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting stitching and cropping test...');
      
      // 1. Parse polyline
      await this.parsePolyline();
      
      // 2. Calculate boundaries
      await this.calculateBounds();
      
      // 3. Get tile data
      await this.fetchTiles();
      
      // 4. Use StitchingService for stitching and cropping
      await this.stitchAndCrop();
      
      // 5. Use ProjectionService for trajectory projection
      await this.projectTrajectory();
      
      // 6. Save final result
      await this.saveResult();
      
      console.log('✅ Test completed! Output file:', this.config.outputPath);
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  /**
   * 解析polyline获取GPS点
   */
  private async parsePolyline(): Promise<void> {
    console.log('📍 解析polyline...');
    this.gpsPoints = PolylineUtil.decode(this.config.polyline);
    console.log(`   解析得到 ${this.gpsPoints.length} 个GPS点`);
    
    if (this.gpsPoints.length > 0) {
      console.log(`   起点: ${this.gpsPoints[0].lat}, ${this.gpsPoints[0].lng}`);
      console.log(`   终点: ${this.gpsPoints[this.gpsPoints.length - 1].lat}, ${this.gpsPoints[this.gpsPoints.length - 1].lng}`);
    }
  }

  /**
   * 计算边界
   */
  private async calculateBounds(): Promise<void> {
    console.log('🗺️  计算边界...');
    
    // 使用配置中的trackRegion，如果没有则使用默认值
    const trackRegion = this.config.trackRegion || { width: 1024, height: 768 };
    
    this.boundaryResult = BoundaryService.calculateBounds(
      this.gpsPoints,
      trackRegion,
      this.config.expansion
    );
    
    // 使用TileService计算最佳缩放级别
    this.zoom = TileService.calculateOptimalZoom(this.boundaryResult.bounds);
    
    console.log('   边界信息:');
    this.printBoundInfo('最终边界', this.boundaryResult.bounds);
    console.log(`   - zoom: ${this.zoom}`);
  }

  /**
   * 获取瓦片数据
   */
  private async fetchTiles(): Promise<void> {
    console.log('🧩 获取瓦片数据...');
    
    const tileResult = TileService.calculateTiles(this.boundaryResult.bounds, this.zoom);
    this.tileGrid = tileResult.tileGrid;
    
    console.log(`   需要获取 ${this.tileGrid.tiles.length} 个瓦片`);
    
    // 确保tiles目录存在
    const tilesDir = './output/tiles';
    if (!fs.existsSync(tilesDir)) {
      fs.mkdirSync(tilesDir, { recursive: true });
    }
    
    // 并行下载所有瓦片
    const downloadPromises = this.tileGrid.tiles.map(async (tileData, i) => {
      const tile = tileData.coord;
      const url = TileService.getTileUrl(tile, false);
      console.log(`   瓦片 ${i + 1}: ${url}`);
      
      try {
        const fetchedTileData = await TileService.fetchTile(tile, false);
        tileData.buffer = fetchedTileData.buffer;
        
        // 保存原始瓦片数据到文件
        const tileFileName = `tile_${this.zoom}_${tile.x}_${tile.y}.png`;
        const tileFilePath = path.join(tilesDir, tileFileName);
        fs.writeFileSync(tileFilePath, fetchedTileData.buffer);
        console.log(`   💾 瓦片已保存: ${tileFilePath}`);
        
        return { success: true, tileData };
      } catch (error) {
        console.log(`   ⚠️  瓦片 ${i + 1} 下载失败，使用占位符`);
        // 如果下载失败，创建一个占位符
        const tileSize = MercatorUtil.getTileSize(false);
        tileData.buffer = Buffer.alloc(tileSize * tileSize * 4); // RGBA placeholder
        return { success: false, tileData, error };
      }
    });
    
    // 等待所有下载完成
    await Promise.all(downloadPromises);
  }

  /**
   * 使用StitchingService进行拼接裁剪
   */
  private async stitchAndCrop(): Promise<void> {
    console.log('🎨 拼接瓦片并裁剪到目标区域...');
    
    try {
      // 使用StitchingService进行拼接裁剪
      this.stitchingResult = await StitchingService.stitchAndCrop(
        this.tileGrid,
        this.zoom
      );
      
      console.log('   拼接裁剪完成:');
      console.log(`   - 裁剪区域: (${this.stitchingResult.pixelBounds.minX}, ${this.stitchingResult.pixelBounds.minY}) 到 (${this.stitchingResult.pixelBounds.maxX}, ${this.stitchingResult.pixelBounds.maxY})`);
      console.log(`   - 图片尺寸: ${this.stitchingResult.pixelBounds.maxX - this.stitchingResult.pixelBounds.minX} x ${this.stitchingResult.pixelBounds.maxY - this.stitchingResult.pixelBounds.minY}`);
      
    } catch (error) {
      console.error('   拼接裁剪失败:', error);
      throw error;
    }
  }



  /**
   * 使用ProjectionService进行轨迹投影
   */
  private async projectTrajectory(): Promise<void> {
    console.log('🎯 投影GPS轨迹到地图...');
    
    try {
      const width =  this.stitchingResult.pixelBounds.maxX - this.stitchingResult.pixelBounds.minX
      const height = this.stitchingResult.pixelBounds.maxY - this.stitchingResult.pixelBounds.minY
      // 使用ProjectionService进行轨迹投影
      this.projectionResult = await ProjectionService.projectTrajectory(
        this.gpsPoints,
        this.stitchingResult.image,
        this.stitchingResult.bounds,
        width,
        height,
        this.zoom,
        this.config.lineColor,
        this.config.lineWidth
      );
      
      console.log('   轨迹投影完成');
      
    } catch (error) {
      console.error('   轨迹投影失败:', error);
      throw error;
    }
  }



  /**
   * 保存最终结果
   */
  private async saveResult(): Promise<void> {
    console.log('💾 保存最终结果...');
    
    const outputDir = path.dirname(this.config.outputPath);
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存最终图片
    fs.writeFileSync(this.config.outputPath, this.projectionResult.finalImage);
    
    console.log(`   图片已保存到: ${this.config.outputPath}`);
  }



  /**
   * 打印边界信息
   */
  private printBoundInfo(name: string, bounds: GeoBounds): void {
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    const aspectRatio = (lngRange / latRange).toFixed(4);
    
    console.log(`   - ${name}: minLat: ${bounds.minLat.toFixed(6)}, maxLat: ${bounds.maxLat.toFixed(6)}, minLng: ${bounds.minLng.toFixed(6)}, maxLng: ${bounds.maxLng.toFixed(6)}, 宽高比: ${aspectRatio}`);
  }
}

/**
 * 主函数
 */
async function main() {
  // 可以在这里修改配置进行测试
  const config: StitchTestConfig = {
    ...defaultConfig,
    // 替换为你的polyline
    polyline: defaultConfig.polyline
  };
  
  const tester = new StitchTester(config);
  await tester.run();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { StitchTester, StitchTestConfig };