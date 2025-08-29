#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { TrajMap, RenderService } from '../src/index';
import { TrajmapConfig } from '../src/types';

/**
 * End-to-end test script for TrajMap rendering
 * Usage: ts-node scripts/test-e2e.ts <polyline> [output_path]
 */
class E2ETest {
  private polyline: string;
  private outputPath: string;
  private trajmapConfig: TrajmapConfig;
  

  constructor(polyline: string, config: TrajmapConfig) {
    this.polyline = polyline;
    this.outputPath = path.join(__dirname, '../output/e2e-test.png');
    this.trajmapConfig = config;
  }

  /**
   * Run the end-to-end test
   */
  async run(): Promise<void> {
    console.log('🚀 Starting end-to-end TrajMap test...');
    console.log(`📍 Polyline: ${this.polyline}`);
    console.log(`💾 Output path: ${this.outputPath}`);
    
    try {
      // Create test configuration

      console.log('⚙️  Configuration created');
      console.log('📊 Track region:', this.trajmapConfig.trackRegion);
      console.log('🔧 Expansion region:', this.trajmapConfig.expansionRegion);

      // Validate configuration
      console.log('✅ Validating configuration...');
      TrajMap.validateConfig(this.trajmapConfig);
      console.log('✅ Configuration is valid');

      // Render the trajectory map
      console.log('🎨 Starting rendering process...');
      const startTime = Date.now();
      
      const result = await TrajMap.render(this.trajmapConfig);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Rendering completed in ${duration}ms`);
      console.log(`📊 Result contains ${result.points.length} trajectory points`);
      console.log(`🖼️  Image data size: ${result.data.length} characters (base64)`);

      // Save the result to file
      console.log('💾 Saving result to file...');
      await RenderService.saveToFile(result, this.outputPath);
      
      // Display summary
      console.log('\n📋 Test Summary:');
      console.log(`   ✅ Polyline processed successfully`);
      console.log(`   ✅ ${result.points.length} GPS points converted to pixels`);
      console.log(`   ✅ Image rendered and saved to ${this.outputPath}`);
      console.log(`   ⏱️  Total processing time: ${duration}ms`);
      
      // Display first few pixel points as sample
      if (result.points.length > 0) {
        console.log('\n📍 Sample pixel coordinates:');
        const sampleCount = Math.min(5, result.points.length);
        for (let i = 0; i < sampleCount; i++) {
          const point = result.points[i];
          console.log(`   Point ${i + 1}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
        }
        if (result.points.length > 5) {
          console.log(`   ... and ${result.points.length - 5} more points`);
        }
      }
      
      console.log('\n🎉 End-to-end test completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const polyline = "}t~FqypxRiEx@@sGmBAsCxMkGvMFxDfCnFtT`GbTpN~@iAzUqLpT_GnReNhq@{AdEoAhD_Ev@uDtBsz@hAeL~Vuh@j@uD]yNfA_G~_@ah@Wq@t@VdCyDyC|DwAmCoDiBMeJkCyFlIyCjEWo@eRx@kCgDiEtB}CKaFmOeBAkGo@gKyFg@cX{MlDiJiBm@qAgC{AIjIwQ|DuDc@`@dWgd@uSwLmEsFiAyKnDuMsB}GcKyN}PhO{O~J_WvJiLjCiAYk@gHvB{@eA}@V}DiAaHG{KrAkDnFqH}@sAb@oAgAcDmGqES_]bAwe@}F{t@{Ioe@cBaDiCmMQyHyLe^i@_H}BkE}H{_@a@qKuD}TmB{VgCkF@qHwCuFgY}cAI{Io@uKeS{o@{DqSsG_MxHcEmDmMCaEuDuTy@oh@}BoCsRgK`Pgb@|DaRp@PhCaFxXyz@dBoLmA{[pJgZG}MkBuDeFeDu\\{BemF_cBqN[oIlEcH`OaCnHVg@h@bAqQpi@gLjUoCjM_Ujr@c@A^kBkCBeAfEgLMsDyDaDzBq^lL{SdEyDjCsKzCuO`J_DxEuAbOgAnF}HfY|BpAzBdDxI|@f@YWiAhA[|@pCzCG_Axb@fC~JfDvF`InCrc@{@hGdArT~RDdAcFxFxKrKeS|RhHlIeE|EChBrIrEuDdHaCl[HzJ|@j@pBh[_@vHuCnKkKbUwPtVgRzULbAtMpFyNsD{JxRaYhMgPfSpFjG}TrScCo@gHvGqAWqB~AmLjQqIxHiAlGgDjHuPtPyFlQwPdDkGhI_ApEOtCn@~@fNJdJhDE|AiFxHkDzJQnR|TjUhJdSjG~DrTjBbSrG_@zCtA`@}BhFtD|CNpFgAbM|DnXY~NoQw@cLpDoHCmAu@eJjDcc@uDOhAtJpQtS`V~A~Da@rIeLrSaGeDwGa@mHiE{GaBoYx@_Io@uYkMmAt@dA|@kUtk@wJ~HbN`K_CjFfA|BZdHlKA`FqAlVpT_F`Fu@xELtBxGlEtBtEiCtNhFxRwDxMlo@vVGpAz@j@gDhPwPbXqA`FMtG~B`\\cIhYk@~FvB`LdCvFmBvJmCdCkCdHpBvSjQzx@hBlQ|FjWIzf@zEpYqCnw@yGnUpAxUtGt@zd@mArZlCv^hHz@rADlG|b@uDbWoLhT_PjBmEbGkCkCeG\\iApK_Dzh@{Fzf@sXxGYbMnBfReAhJwGfv@m\\lKgI~Af@dHsK|\\mUjZwBh^Cxe@{BpMsJ|J}BlJyEbLwIvNaQhn@cOsB~@}DuD{NkHsJoDmI}@gCiHEmCnFqNtBeO~AD"
  
  const test = new E2ETest(polyline, {
        polyline: polyline,
        trackRegion: {
          width: 800,
          height: 600
        },
        expansionRegion: {
          downPercent: 0.5
        },
        output: './output/test.png',
        lineColor: '#FF5500',
        lineWidth: 4,
        retina: true
      });
  await test.run();
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { E2ETest };