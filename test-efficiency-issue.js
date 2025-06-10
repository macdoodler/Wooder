const { OptimizedCuttingEngine } = require('./app/lib/optimized-cutting-engine.ts');

// Test case: 14 parts of 800x400mm - should be much more efficient than 50.2%
const testParts = [
  { 
    partIndex: 0, 
    length: 800, 
    width: 400, 
    quantity: 14,
    material: 'plywood',
    thickness: 18,
    grainDirection: 'any',
    priority: 1 
  }
];

const testStock = [
  {
    stockIndex: 0,
    length: 2440,
    width: 1220,
    thickness: 18,
    material: 'plywood',
    quantity: 4, // 4 sheets available
    cost: 80
  }
];

console.log('🧪 TESTING INEFFICIENT PACKING ISSUE');
console.log('📊 Parts: 14x 800x400mm parts');
console.log('📦 Stock: 4x 2440x1220mm sheets available');
console.log('🎯 Expected: Should achieve much better than 50.2% efficiency');
console.log('');

// Calculate theoretical maximum
const partArea = 800 * 400; // 320,000 mm²
const totalPartArea = partArea * 14; // 4,480,000 mm²
const sheetArea = 2440 * 1220; // 2,976,800 mm²
const theoreticalEfficiency = (totalPartArea / (2 * sheetArea)) * 100; // Should fit in ~1.5 sheets

console.log(`📐 THEORETICAL ANALYSIS:`);
console.log(`   Single part area: ${partArea.toLocaleString()}mm²`);
console.log(`   Total parts area: ${totalPartArea.toLocaleString()}mm²`);
console.log(`   Single sheet area: ${sheetArea.toLocaleString()}mm²`);
console.log(`   Theoretical efficiency on 2 sheets: ${theoreticalEfficiency.toFixed(1)}%`);
console.log(`   Parts per sheet calculation: ${(sheetArea / partArea).toFixed(1)} parts could fit per sheet`);
console.log('');

try {
  const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 2.4);
  
  console.log('📈 ACTUAL RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Sheets Used: ${result.totalUsedSheets}`);
  console.log(`📊 Efficiency: ${result.efficiency ? result.efficiency.toFixed(1) : 'N/A'}%`);
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
    
    console.log(`📊 EFFICIENCY ANALYSIS:`);
    console.log(`   Total parts placed: ${totalPartsPlaced} / 14`);
    console.log(`   Average efficiency per sheet: ${(result.stockUsage.reduce((sum, sheet) => sum + (sheet.usedArea / sheetArea), 0) / result.stockUsage.length * 100).toFixed(1)}%`);
    
    if (totalPartsPlaced < 14) {
      console.log(`   ❌ MISSING PARTS: ${14 - totalPartsPlaced} parts not placed!`);
    }
  }
  
  console.log('🔍 PROBLEM ANALYSIS:');
  const actualSheetsUsed = result.totalUsedSheets || result.stockUsage?.length || 0;
  if (actualSheetsUsed > 2) {
    console.log('❌ INEFFICIENCY DETECTED: Using more sheets than necessary');
    console.log(`   Using ${actualSheetsUsed} sheets instead of optimal 2 sheets`);
    console.log('   This suggests poor packing algorithm or strategic distribution being too aggressive');
  } else {
    console.log('✅ Efficient sheet usage');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}
