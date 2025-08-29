#!/usr/bin/env node
/**
 * 运行瓦片测试脚本
 */

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('🚀 开始运行瓦片测试...');
  
  // 使用ts-node运行TypeScript脚本
  const scriptPath = path.join(__dirname, 'test-tiles.ts');
  const command = `npx ts-node ${scriptPath}`;
  
  console.log('执行命令:', command);
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ 测试完成！');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
}