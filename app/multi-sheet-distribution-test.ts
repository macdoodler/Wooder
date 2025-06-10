import { OptimizedCuttingEngine } from './lib/optimized-cutting-engine';
import { Stock, Part, MaterialType } from './lib/types';

// Test case: 16 parts (10x 600x400mm + 6x 200x200mm) should distribute across multiple sheets
const testParts: Part[] = [
  { 
    length: 600, 
    width: 400, 
    quantity: 10,
    material: 'plywood',
    materialType: MaterialType.Sheet,
    thickness: 18,
    grainDirection: 'any'
  },
  { 
    length: 200, 
    width: 200, 
    quantity: 6,
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
    quantity: 3, // 3 sheets available
    grainDirection: 'horizontal'
  }
];

console.log('🧪 TESTING MULTI-SHEET DISTRIBUTION ISSUE');
console.log('📊 Parts: 10x 600x400mm + 6x 200x200mm = 16 total parts');
console.log('📦 Stock: 3x 2440x1220mm sheets available');
console.log('🎯 Expected: Parts should distribute across multiple sheets for better efficiency/practicality');
console.log('');

try {
  const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 3.2);
  
  console.log('📈 RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Sheets Used: ${result.totalUsedSheets}`);
  console.log('');
  
  if (result.stockUsage && result.stockUsage.length > 0) {
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1);
      console.log(`📄 Sheet ${index + 1}:`);
      console.log(`   Parts Placed: ${sheet.placements.length}`);
      console.log(`   Efficiency: ${efficiency}%`);
      console.log(`   Used Area: ${sheet.usedArea.toLocaleString()}mm²`);
      console.log(`   Waste Area: ${sheet.wasteArea.toLocaleString()}mm²`);
      
      // Show part breakdown
      const partCounts: Record<string, number> = {};
      sheet.placements.forEach(placement => {
        const partType = placement.partId.includes('0-') ? '600x400mm' : '200x200mm';
        partCounts[partType] = (partCounts[partType] || 0) + 1;
      });
      
      console.log(`   Part breakdown:`, partCounts);
      console.log('');
    });
  }
  
  console.log('🔍 ANALYSIS:');
  if (result.totalUsedSheets === 1) {
    console.log('❌ PROBLEM DETECTED: All parts crammed onto single sheet');
    console.log('   This creates practical cutting challenges and may not be optimal');
    console.log('   Single sheet efficiency:', ((result.stockUsage![0].usedArea / (2440 * 1220)) * 100).toFixed(1) + '%');
    
    // Check if we could spread parts across multiple sheets
    const totalPartArea = 16 * 600 * 400 + 6 * 200 * 200;
    const singleSheetArea = 2440 * 1220;
    const theoreticalEfficiencyPerSheet = totalPartArea / (2 * singleSheetArea);
    console.log(`   Better distribution across 2 sheets would achieve: ${(theoreticalEfficiencyPerSheet * 100).toFixed(1)}% per sheet`);
  } else {
    console.log('✅ Parts properly distributed across multiple sheets');
  }
  
} catch (error: any) {
  console.error('❌ Test failed:', error.message);
}
