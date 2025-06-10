import { describe, test, expect } from '@jest/globals';
import { OptimizedCuttingEngine } from '../lib/optimized-cutting-engine';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Efficiency Restoration Test', () => {
  test('14 parts of 800x400mm should achieve high efficiency on 2 sheets', () => {
    console.log('\n🧪 === EFFICIENCY RESTORATION TEST ===');
    console.log('Issue: Strategic distribution forcing wasteful 3-sheet layouts');
    console.log('Expected: 14x 800x400mm parts should efficiently use ~2 sheets\n');
    
    // Test case: 14 parts of 800x400mm - should be much more efficient than 50.2%
    const testParts: Part[] = [
      { 
        length: 800, 
        width: 400, 
        quantity: 14,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        thickness: 18,
        grainDirection: 'any'
      }
    ];

    const testStock: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 4, // 4 sheets available
        grainDirection: 'horizontal'
      }
    ];

    // Calculate theoretical maximum
    const partArea = 800 * 400; // 320,000 mm²
    const totalPartArea = partArea * 14; // 4,480,000 mm²
    const sheetArea = 2440 * 1220; // 2,976,800 mm²
    const optimalSheets = Math.ceil(totalPartArea / (sheetArea * 0.85)); // Target 85% efficiency
    const theoreticalEfficiency = (totalPartArea / (optimalSheets * sheetArea)) * 100;

    console.log(`📐 THEORETICAL ANALYSIS:`);
    console.log(`   Single part area: ${partArea.toLocaleString()}mm²`);
    console.log(`   Total parts area: ${totalPartArea.toLocaleString()}mm²`);
    console.log(`   Single sheet area: ${sheetArea.toLocaleString()}mm²`);
    console.log(`   Optimal sheets needed: ${optimalSheets}`);
    console.log(`   Target efficiency: ${theoreticalEfficiency.toFixed(1)}%`);
    console.log(`   Parts that could fit per sheet: ${Math.floor(sheetArea / partArea)} parts`);
    console.log('');

    const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 2.4);
    
    console.log('📈 ACTUAL RESULTS:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📋 Message: ${result.message}`);
    console.log(`📦 Sheets Used: ${result.totalUsedSheets}`);
    console.log('');
    
    if (result.stockUsage && result.stockUsage.length > 0) {
      let totalPartsPlaced = 0;
      result.stockUsage.forEach((sheet, index) => {
        const efficiency = ((sheet.usedArea / sheetArea) * 100).toFixed(1);
        totalPartsPlaced += sheet.placements.length;
        console.log(`📄 Sheet ${index + 1}:`);
        console.log(`   Parts Placed: ${sheet.placements.length}`);
        console.log(`   Efficiency: ${efficiency}%`);
        console.log(`   Used Area: ${sheet.usedArea.toLocaleString()}mm²`);
        console.log(`   Waste Area: ${sheet.wasteArea.toLocaleString()}mm²`);
        console.log('');
      });
      
      const actualEfficiency = (totalPartArea / (result.totalUsedSheets * sheetArea)) * 100;
      console.log(`📊 EFFICIENCY ANALYSIS:`);
      console.log(`   Total parts placed: ${totalPartsPlaced} / 14`);
      console.log(`   Actual overall efficiency: ${actualEfficiency.toFixed(1)}%`);
      console.log(`   Target efficiency: ${theoreticalEfficiency.toFixed(1)}%`);
      
      if (totalPartsPlaced < 14) {
        console.log(`   ❌ MISSING PARTS: ${14 - totalPartsPlaced} parts not placed!`);
      }
    }
    
    console.log('🔍 EFFICIENCY ANALYSIS:');
    const actualSheetsUsed = result.totalUsedSheets || result.stockUsage?.length || 0;
    const actualOverallEfficiency = result.stockUsage ? 
      (totalPartArea / (actualSheetsUsed * sheetArea)) * 100 : 0;
      
    if (actualSheetsUsed <= optimalSheets && actualOverallEfficiency >= 60) {
      console.log(`✅ EFFICIENT: Using ${actualSheetsUsed} sheets with ${actualOverallEfficiency.toFixed(1)}% efficiency`);
    } else {
      console.log(`❌ INEFFICIENT: Using ${actualSheetsUsed} sheets (optimal: ${optimalSheets}) with ${actualOverallEfficiency.toFixed(1)}% efficiency`);
      console.log('   Strategic distribution may be too aggressive for this case');
    }
    
    // Test assertions
    expect(result.success).toBe(true);
    expect(result.stockUsage).toBeDefined();
    expect(result.stockUsage!.length).toBeLessThanOrEqual(optimalSheets + 1); // Allow 1 extra sheet tolerance
    
    // Efficiency should be reasonable (at least 60% overall)
    const totalUsedArea = result.stockUsage!.reduce((sum, sheet) => sum + sheet.usedArea, 0);
    const totalSheetArea = actualSheetsUsed * sheetArea;
    const actualEfficiency = (totalUsedArea / totalSheetArea) * 100;
    expect(actualEfficiency).toBeGreaterThanOrEqual(60);
  });
});
