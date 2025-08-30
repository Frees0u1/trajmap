# 瓦片测试脚本

这个目录包含用于测试TrajMap瓦片获取功能的脚本。

## 文件说明

- `test-tiles.ts` - 主要的测试脚本，包含完整的瓦片获取和图片生成流程
- `run-test.js` - 运行脚本的便捷入口
- `README.md` - 本说明文档

## 功能特性

测试脚本实现了以下功能：

1. **Polyline解析** - 将编码的polyline字符串解析为GPS坐标点
2. **边界计算** - 根据GPS点计算地理边界
3. **瓦片坐标计算** - 确定需要获取的地图瓦片坐标
4. **瓦片URL生成** - 生成随机子域名的瓦片URL（支持a、b、c、d四个子域名）
5. **图片生成** - 创建包含以下元素的可视化图片：
   - 瓦片网格布局
   - GPS轨迹线（蓝色）
   - 起点标记（绿色圆点）
   - 终点标记（红色圆点）
   - 边界辅助线（红色虚线框）
   - step1InitBound-step4ExpansionBound labels and coordinates

## 使用方法

### 快速开始

```bash
# 运行测试（使用默认polyline）
node scripts/run-test.js
```

### 自定义Polyline测试

1. 编辑 `scripts/test-tiles.ts` 文件
2. 找到 `defaultConfig` 对象
3. 替换 `polyline` 字段为你的polyline字符串
4. 运行测试：

```bash
node scripts/run-test.js
```

### 配置选项

可以在 `TestConfig` 接口中配置以下参数：

```typescript
interface TestConfig {
  polyline: string;        // 编码的polyline字符串
  trackRegion: TrackRegion; // 输出图片尺寸
  outputPath: string;      // 输出文件路径
  zoom?: number;          // 可选：指定缩放级别
}
```

### 输出结果

脚本运行后会：

1. 在控制台显示详细的处理信息：
   - GPS点数量和起终点坐标
   - 计算出的地理边界
   - 瓦片网格信息
   - 生成的瓦片URL示例

2. 生成可视化图片（默认保存到 `./output/test-tiles.png`）：
   - 1024x768像素的PNG图片
   - 包含瓦片网格、GPS轨迹和边界标注

## 示例输出

```
🚀 开始瓦片获取测试...
📍 解析polyline...
   解析得到 53 个GPS点
   起点: 40.63179, 88.77738000000001
   终点: 40.63369, 88.76687000000001
🗺️  计算边界...
   边界信息:
   - minLat: 40.627268750000006
   - maxLat: 40.63515125
   - minLng: 88.76687000000001
   - maxLng: 88.77738000000001
   - zoom: 15
🧩 计算瓦片坐标...
   需要获取 4 个瓦片
   瓦片网格: 2 x 2
⬇️  获取瓦片数据...
   瓦片 1: https://c.basemaps.cartocdn.com/rastertiles/voyager/15/24463/12329@2x.png
   瓦片 2: https://a.basemaps.cartocdn.com/rastertiles/voyager/15/24463/12330@2x.png
   瓦片 3: https://c.basemaps.cartocdn.com/rastertiles/voyager/15/24464/12329@2x.png
   瓦片 4: https://b.basemaps.cartocdn.com/rastertiles/voyager/15/24464/12330@2x.png
🎨 拼接瓦片并绘制辅助线...
   图片已保存到: ./output/test-tiles.png
✅ 测试完成！
```

## 边界标注说明

生成的图片中包含四个边界点的标注：

- **step1InitBound** (top-left): (minLng, maxLat)
- **step2BufferBound** (top-right): (maxLng, maxLat)
- **step3TrackBound** (bottom-right): (maxLng, minLat)
- **step4ExpansionBound** (bottom-left): (minLng, minLat)

## 依赖要求

- Node.js >= 14.0.0
- TypeScript
- ts-node
- canvas (用于图像处理)
- axios (用于HTTP请求)

## 注意事项

1. 脚本目前只生成瓦片URL和模拟图片，不实际下载瓦片图像
2. 输出图片使用Canvas API绘制，包含网格、轨迹和标注信息
3. 瓦片URL使用随机子域名（a、b、c、d），有助于负载均衡
4. 默认使用CartoDB Voyager地图样式

## 扩展功能

可以基于此脚本扩展以下功能：

- 实际下载瓦片图像并拼接
- 支持不同的地图样式
- 添加更多的可视化元素
- 支持批量测试多个polyline
- 导出不同格式的图片