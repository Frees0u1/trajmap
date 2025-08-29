#!/usr/bin/env ts-node
/**
 * 瓦片获取测试脚本
 * 用于测试从polyline到瓦片拼接的完整流程
 */

import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// 导入项目模块
import { PolylineUtil } from '../src/utils/polyline';
import { BoundaryService } from '../src/boundary';
import { TileService } from '../src/tiles';
import { MercatorUtil } from '../src/utils/mercator';
import { LatLng, GeoBounds, TrackRegion, TileCoord, BoundaryResult, ExpansionRegion } from '../src/types';

/**
 * 配置参数
 */
interface TestConfig {
  polyline: string;
  outputPath: string;
  trackRegion?: TrackRegion;
  expansion?: ExpansionRegion;
}

/**
 * 默认配置 - 可以替换polyline进行测试
 */
const defaultConfig: TestConfig = {
  // 示例polyline
  polyline: '}t~FqypxRiEx@@sGmBAsCxMkGvMFxDfCnFtT`GbTpN~@iAzUqLpT_GnReNhq@{AdEoAhD_Ev@uDtBsz@hAeL~Vuh@j@uD]yNfA_G~_@ah@Wq@t@VdCyDyC|DwAmCoDiBMeJkCyFlIyCjEWo@eRx@kCgDiEtB}CKaFmOeBAkGo@gKyFg@cX{MlDiJiBm@qAgC{AIjIwQ|DuDc@`@dWgd@uSwLmEsFiAyKnDuMsB}GcKyN}PhO{O~J_WvJiLjCiAYk@gHvB{@eA}@V}DiAaHG{KrAkDnFqH}@sAb@oAgAcDmGqES_]bAwe@}F{t@{Ioe@cBaDiCmMQyHyLe^i@_H}BkE}H{_@a@qKuD}TmB{VgCkF@qHwCuFgY}cAI{Io@uKeS{o@{DqSsG_MxHcEmDmMCaEuDuTy@oh@}BoCsRgK`Pgb@|DaRp@PhCaFxXyz@dBoLmA{[pJgZG}MkBuDeFeDu\\{BemF_cBqN[oIlEcH`OaCnHVg@h@bAqQpi@gLjUoCjM_Ujr@c@A^kBkCBeAfEgLMsDyDaDzBq^lL{SdEyDjCsKzCuO`J_DxEuAbOgAnF}HfY|BpAzBdDxI|@f@YWiAhA[|@pCzCG_Axb@fC~JfDvF`InCrc@{@hGdArT~RDdAcFxFxKrKeS|RhHlIeE|EChBrIrEuDdHaCl[HzJ|@j@pBh[_@vHuCnKkKbUwPtVgRzULbAtMpFyNsD{JxRaYhMgPfSpFjG}TrScCo@gHvGqAWqB~AmLjQqIxHiAlGgDjHuPtPyFlQwPdDkGhI_ApEOtCn@~@fNJdJhDE|AiFxHkDzJQnR|TjUhJdSjG~DrTjBbSrG_@zCtA`@}BhFtD|CNpFgAbM|DnXY~NoQw@cLpDoHCmAu@eJjDcc@uDOhAtJpQtS`V~A~Da@rIeLrSaGeDwGa@mHiE{GaBoYx@_Io@uYkMmAt@dA|@kUtk@wJ~HbN`K_CjFfA|BZdHlKA`FqAlVpT_F`Fu@xELtBxGlEtBtEiCtNhFxRwDxMlo@vVGpAz@j@gDhPwPbXqA`FMtG~B`\\cIhYk@~FvB`LdCvFmBvJmCdCkCdHpBvSjQzx@hBlQ|FjWIzf@zEpYqCnw@yGnUpAxUtGt@zd@mArZlCv^hHz@rADlG|b@uDbWoLhT_PjBmEbGkCkCeG\\iApK_Dzh@{Fzf@sXxGYbMnBfReAhJwGfv@m\\lKgI~Af@dHsK|\\mUjZwBh^Cxe@{BpMsJ|J}BlJyEbLwIvNaQhn@cOsB~@}DuD{NkHsJoDmI}@gCiHEmCnFqNtBeO~AD',
  outputPath: './output/test-tiles.png',
  trackRegion: {
    width: 4,
    height: 4
  },
  expansion: {
    rightPercent: 0.5,
  },
};

/**
 * 瓦片测试类
 */
class TilesTester {
  private config: TestConfig;
  private gpsPoints: LatLng[] = [];
  private boundaryResult!: BoundaryResult;
  private tiles: TileCoord[] = [];
  private canvas!: Canvas;
  private ctx!: CanvasRenderingContext2D;
  private zoom!: number;
  private tileBounds!: GeoBounds;

  constructor(config: TestConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * 运行完整测试流程
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 开始瓦片获取测试...');
      
      // 1. 解析polyline
      await this.parsePolyline();
      
      // 2. 计算边界
      await this.calculateBounds();
      
      // 3. 计算瓦片坐标
      await this.calculateTiles();
      
      // 4. 获取瓦片数据
      await this.fetchTiles();
      
      // 5. 拼接瓦片并绘制辅助线
      await this.stitchTilesAndDrawBounds();
      
      console.log('✅ 测试完成！输出文件:', this.config.outputPath);
    } catch (error) {
      console.error('❌ 测试失败:', error);
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
    
    // 内联方法：打印边界信息和宽高比
    const printBoundInfo = (name: string, bounds: GeoBounds) => {
      const latRange = bounds.maxLat - bounds.minLat;
      const lngRange = bounds.maxLng - bounds.minLng;
      const aspectRatio = (lngRange / latRange).toFixed(4);
      
      // 生成边界四边形的顶点（顺时针：左下 -> 右下 -> 右上 -> 左上 -> 左下闭合）
      const boundaryPoints: LatLng[] = [
        { lat: bounds.minLat, lng: bounds.minLng }, // 左下角
        { lat: bounds.minLat, lng: bounds.maxLng }, // 右下角
        { lat: bounds.maxLat, lng: bounds.maxLng }, // 右上角
        { lat: bounds.maxLat, lng: bounds.minLng }, // 左上角
        { lat: bounds.minLat, lng: bounds.minLng }  // 闭合到左下角
      ];
      
      // 编码为polyline
      const boundaryPolyline = PolylineUtil.encode(boundaryPoints);
      
      console.log(`   - ${name}: minLat: ${bounds.minLat.toFixed(6)}, maxLat: ${bounds.maxLat.toFixed(6)}, minLng: ${bounds.minLng.toFixed(6)}, maxLng: ${bounds.maxLng.toFixed(6)}, 宽高比: ${aspectRatio}`);
      console.log(`     四边形polyline: ${boundaryPolyline}`);
    };
    
    console.log('   边界信息:');
    printBoundInfo('bound0 (初始)', this.boundaryResult.bound0);
    printBoundInfo('bound1 (10% buffer)', this.boundaryResult.bound1);
    printBoundInfo('bound2 (trackRegion)', this.boundaryResult.bound2);
    printBoundInfo('bound3 (expansion)', this.boundaryResult.bound3);
    printBoundInfo('最终边界', this.boundaryResult.bounds);
    console.log(`   - zoom: ${this.zoom}`);
  }

  /**
   * 计算需要的瓦片坐标
   */
  private async calculateTiles(): Promise<void> {
    console.log('🧩 计算瓦片坐标...');
    
    const tileResult = TileService.calculateTiles(this.boundaryResult.bounds, this.zoom);
    this.tiles = [];
    
    // 提取所有瓦片坐标
    for (const tileData of tileResult.tileGrid.tiles) {
      this.tiles.push(tileData.coord);
    }
    
    // 计算网格尺寸
    const coords = this.tiles.map(t => t);
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));
    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    
    console.log(`   需要获取 ${this.tiles.length} 个瓦片`);
    console.log(`   瓦片网格: ${cols} x ${rows}`);
  }

  /**
   * 获取瓦片数据
   */
  private async fetchTiles(): Promise<void> {
    console.log('⬇️  获取瓦片数据...');
    
    // 确保tiles目录存在
    const tilesDir = './output/tiles';
    if (!fs.existsSync(tilesDir)) {
      fs.mkdirSync(tilesDir, { recursive: true });
    }
    
    // 并行下载所有瓦片
    const downloadPromises = this.tiles.map(async (tile, i) => {
    const url = TileService.getTileUrl(tile, false);
    console.log(`   瓦片 ${i + 1}: ${url}`);
    
    try {
      const tileData = await TileService.fetchTile(tile, false);
      (tile as any).imageData = tileData.buffer;
      
      // 保存原始瓦片数据到文件
      const tileFileName = `tile_${this.zoom}_${tile.x}_${tile.y}.png`;
      const tileFilePath = path.join(tilesDir, tileFileName);
      fs.writeFileSync(tileFilePath, tileData.buffer);
      console.log(`   💾 瓦片已保存: ${tileFilePath}`);
      
      return { success: true, tile, tileData };
    } catch (error) {
      console.log(`   ⚠️  瓦片 ${i + 1} 下载失败，使用占位符`);
      // 如果下载失败，创建一个占位符
      (tile as any).imageData = null;
      return { success: false, tile, error };
    }
  });
    
    // 等待所有下载完成
    await Promise.all(downloadPromises);
  }

  /**
   * 拼接瓦片并绘制边界辅助线
   */
  private async stitchTilesAndDrawBounds(): Promise<void> {
    console.log('🎨 拼接瓦片并绘制辅助线...');
    
    // 根据瓦片数量创建画布 - 每个瓦片256x256像素
    const tileSize = 256;
    const gridCols = Math.max(...this.tiles.map(t => t.x)) - Math.min(...this.tiles.map(t => t.x)) + 1;
    const gridRows = Math.max(...this.tiles.map(t => t.y)) - Math.min(...this.tiles.map(t => t.y)) + 1;
    
    this.canvas = createCanvas(gridCols * tileSize, gridRows * tileSize);
    this.ctx = this.canvas.getContext('2d');
    
    // 填充背景色
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制瓦片网格（模拟）
    await this.drawTileGrid();
    
    // 绘制边界辅助线
    await this.drawBoundaryLines();
    
    // 绘制GPS轨迹
    await this.drawGpsTrack();
    
    // 保存图片
    await this.saveImage();
  }

  /**
   * 绘制瓦片网格
   */
  private async drawTileGrid(): Promise<void> {
    // 计算网格尺寸
    const coords = this.tiles.map(t => t);
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));
    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    
    const tileWidth = this.canvas.width / cols;
    const tileHeight = this.canvas.height / rows;
    
    // 绘制实际瓦片图像
    for (const tile of this.tiles) {
      const col = tile.x - minX;
      const row = tile.y - minY;
      const x = col * tileWidth;
      const y = row * tileHeight;
      
      if ((tile as any).imageData) {
        try {
          const image = await loadImage((tile as any).imageData);
          this.ctx.drawImage(image, x, y, tileWidth, tileHeight);
        } catch (error) {
          // 如果图像加载失败，绘制占位符
          this.drawTilePlaceholder(x, y, tileWidth, tileHeight, tile);
        }
      } else {
        // 绘制占位符
        this.drawTilePlaceholder(x, y, tileWidth, tileHeight, tile);
      }
      
      // 绘制瓦片边界
      this.drawTileBoundary(x, y, tileWidth, tileHeight, tile);
    }
  }
  
  /**
   * 绘制瓦片占位符
   */
  private drawTilePlaceholder(x: number, y: number, width: number, height: number, tile: TileCoord): void {
    // 绘制背景
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fillRect(x, y, width, height);
    
    // 绘制边框
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // 绘制瓦片信息
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${tile.z}/${tile.x}/${tile.y}`, x + width/2, y + height/2 - 5);
    this.ctx.fillText('No Image', x + width/2, y + height/2 + 10);
  }
  
  /**
   * 绘制瓦片边界
   */
  private drawTileBoundary(x: number, y: number, width: number, height: number, tile: TileCoord): void {
    // 绘制瓦片边框
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // 绘制瓦片坐标信息
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${tile.z}/${tile.x}/${tile.y}`, x + 5, y + 20);
    
    // 计算并显示瓦片的地理边界
    const tileBounds = this.getTileBounds(tile);
    this.ctx.font = '10px Arial';
    this.ctx.fillText(`N: ${tileBounds.maxLat.toFixed(6)}`, x + 5, y + 35);
    this.ctx.fillText(`S: ${tileBounds.minLat.toFixed(6)}`, x + 5, y + height - 25);
    this.ctx.fillText(`W: ${tileBounds.minLng.toFixed(6)}`, x + 5, y + height - 10);
    this.ctx.fillText(`E: ${tileBounds.maxLng.toFixed(6)}`, x + width - 80, y + height - 10);
  }
  
  /**
   * 获取瓦片的地理边界
   */
  private getTileBounds(tile: TileCoord): GeoBounds {
    // 使用MercatorUtil保持一致性
    return MercatorUtil.tileToBounds(tile.x, tile.y, tile.z);
  }

  /**
   * 绘制边界辅助线
   */
  private async drawBoundaryLines(): Promise<void> {
    // 基于瓦片的地理边界来绘制边界辅助线
    
    // 计算瓦片覆盖的地理边界
    const minTileX = Math.min(...this.tiles.map(t => t.x));
    const maxTileX = Math.max(...this.tiles.map(t => t.x));
    const minTileY = Math.min(...this.tiles.map(t => t.y));
    const maxTileY = Math.max(...this.tiles.map(t => t.y));
    
    // 计算瓦片网格的地理边界并保存到tileBounds
    const topLeftBounds = MercatorUtil.tileToBounds(minTileX, minTileY, this.zoom);
    const bottomRightBounds = MercatorUtil.tileToBounds(maxTileX, maxTileY, this.zoom);
    
    this.tileBounds = {
      minLat: bottomRightBounds.minLat,
      maxLat: topLeftBounds.maxLat,
      minLng: topLeftBounds.minLng,
      maxLng: bottomRightBounds.maxLng
    };
    
    // 使用瓦片地理边界和画布尺寸进行坐标转换
    const convertToPixel = (latLng: LatLng) => {
      return MercatorUtil.latLngToPixel(latLng, this.tileBounds, this.canvas.width, this.canvas.height, this.zoom);
    };
    
    // 绘制所有边界框的辅助函数
    const drawBoundaryBox = (bounds: GeoBounds, color: string, lineWidth: number, lineDash: number[], label: string) => {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.setLineDash(lineDash);
      
      const topLeft = convertToPixel({ lat: bounds.maxLat, lng: bounds.minLng });
      const bottomRight = convertToPixel({ lat: bounds.minLat, lng: bounds.maxLng });
      const x1 = topLeft.x;
      const y1 = topLeft.y;
      const x2 = bottomRight.x;
      const y2 = bottomRight.y;
      
      this.ctx.beginPath();
      this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
      this.ctx.stroke();
      
      // 绘制标签
      this.ctx.setLineDash([]);
      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = color;
      this.ctx.fillText(label, x1 + 5, y1 + 15);
      
      console.log(`   ${label}: (${x1.toFixed(1)}, ${y1.toFixed(1)}) 到 (${x2.toFixed(1)}, ${y2.toFixed(1)})`);
    };
    
    // 绘制所有边界框
    drawBoundaryBox(this.boundaryResult.bound0, '#0000ff', 2, [8, 4], 'bound0 (初始)');
    drawBoundaryBox(this.boundaryResult.bound1, '#0000f0', 2, [8, 4], 'bound1 (10% buffer)');
    drawBoundaryBox(this.boundaryResult.bound2, '#ff8800', 3, [12, 6], 'bound2 (trackRegion)');
    drawBoundaryBox(this.boundaryResult.bound3, '#ff0000', 3, [15, 5], 'bound3 (expansion)');
    drawBoundaryBox(this.boundaryResult.bounds, '#ff0000', 3, [], '最终边界');
    
    // 绘制连接四个边界框的polyline
    const bounds = [this.boundaryResult.bound0, this.boundaryResult.bound1, this.boundaryResult.bound2, this.boundaryResult.bound3];
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    
    this.ctx.beginPath();
    for (let i = 0; i < bounds.length; i++) {
      const bound = bounds[i];
      // 计算边界框的中心点
      const centerLat = (bound.minLat + bound.maxLat) / 2;
      const centerLng = (bound.minLng + bound.maxLng) / 2;
      const centerPixel = convertToPixel({ lat: centerLat, lng: centerLng });
      
      if (i === 0) {
        this.ctx.moveTo(centerPixel.x, centerPixel.y);
      } else {
        this.ctx.lineTo(centerPixel.x, centerPixel.y);
      }
    }
    this.ctx.stroke();
    
    // 重置样式
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1;
  }

  /**
   * 绘制GPS轨迹
   */
  private async drawGpsTrack(): Promise<void> {
    if (this.gpsPoints.length < 2) return;
    
    // 使用瓦片边界和画布尺寸进行坐标转换
    const convertToPixel = (latLng: LatLng) => {
      return MercatorUtil.latLngToPixel(latLng, this.tileBounds, this.canvas.width, this.canvas.height, this.zoom);
    };
    
    // 绘制轨迹线
    this.ctx.strokeStyle = '#0066cc';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    
    this.ctx.beginPath();
    const firstPoint = this.gpsPoints[0];
    const firstPixel = convertToPixel(firstPoint);
    this.ctx.moveTo(firstPixel.x, firstPixel.y);
    
    for (let i = 1; i < this.gpsPoints.length; i++) {
      const point = this.gpsPoints[i];
      const pixel = convertToPixel(point);
      this.ctx.lineTo(pixel.x, pixel.y);
    }
    
    this.ctx.stroke();
    
    // 绘制起点和终点
    const startPoint = this.gpsPoints[0];
    const endPoint = this.gpsPoints[this.gpsPoints.length - 1];
    
    // 起点（绿色）
    this.ctx.fillStyle = '#00cc00';
    this.ctx.beginPath();
    const startPixel = convertToPixel(startPoint);
    this.ctx.arc(startPixel.x, startPixel.y, 6, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // 终点（红色）
    this.ctx.fillStyle = '#cc0000';
    this.ctx.beginPath();
    const endPixel = convertToPixel(endPoint);
    this.ctx.arc(endPixel.x, endPixel.y, 6, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  /**
   * 保存图片
   */
  private async saveImage(): Promise<void> {
    const outputDir = path.dirname(this.config.outputPath);
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存为PNG
    const buffer = this.canvas.toBuffer('image/png');
    fs.writeFileSync(this.config.outputPath, buffer);
    
    console.log(`   图片已保存到: ${this.config.outputPath}`);
  }
}

/**
 * 主函数
 */
async function main() {
  // 可以在这里修改polyline进行测试
  const config: TestConfig = {
    ...defaultConfig,
    // 替换为你的polyline
    polyline: defaultConfig.polyline
  };
  
  const tester = new TilesTester(config);
  await tester.run();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { TilesTester, TestConfig };