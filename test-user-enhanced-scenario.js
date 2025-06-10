/**
 * Test the user's specific scenario with enhanced efficiency algorithms
 * Target: Improve from 59.1% overall efficiency and eliminate 8.1% third sheet waste
 */

const { OptimizedCuttingEngine } = require('./app/lib/optimized-cutting-engine.ts');

console.log('🧪 Testing user scenario: 14x 800x400mm + 10x 400x200mm parts');
console.log('Target: Improve from 59.1% overall efficiency and eliminate 8.1% third sheet waste');
console.log('');

// User's actual test case - the problematic scenario
const userStock = [
  {
    stockIndex: 0,
    length: 2440,
    width: 1220,
    thickness: 18,
    material: 'mdf',
    grainDirection: 'length',
    originalQuantity: 10,
    remainingQuantity: 10
  }
];

const userParts = [
  // Large parts (14x 800x400mm) - these were filling 2 sheets at 75% efficiency
  { 
    partIndex: 0, 
    length: 800, 
    width: 400, 
    thickness: 18, 
    material: 'mdf', 
    grainDirection: 'any', 
    quantity: 14, 
    name: 'Cabinet Side' 
  },
  // Small parts (10x 400x200mm) - these were going to a wasteful 3rd sheet
  { 
    partIndex: 1, 
    length: 400, 
    width: 200, 
    thickness: 18, 
    material: 'mdf', 
    grainDirection: 'any', 
    quantity: 10, 
    name: 'Shelf' 
  }
];

// Calculate theoretical efficiency
const sheetArea = 2440 * 1220; // 2,976,800mm²
const totalPartArea = (14 * 800 * 400) + (10 * 400 * 200); // 4,480,000 + 800,000 = 5,280,000mm²
const theoreticalSheets = Math.ceil(totalPartArea / sheetArea); // Should be 2 sheets
const theoreticalEfficiency = (totalPartArea / (theoreticalSheets * sheetArea)) * 100;

console.log('📐 THEORETICAL ANALYSIS:');
console.log(`   Total part area: ${totalPartArea.toLocaleString()}mm²`);
console.log(`   Sheet area: ${sheetArea.toLocaleString()}mm²`);
console.log(`   Optimal sheets needed: ${theoreticalSheets}`);
console.log(`   Theoretical efficiency: ${theoreticalEfficiency.toFixed(1)}%`);
console.log('');

try {
  console.log('🚀 Starting optimization with enhanced efficiency algorithms...');
  const result = OptimizedCuttingEngine.executeOptimization(userStock, userParts, 2.4);
  
  console.log('📊 OPTIMIZATION RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Total Sheets Used: ${result.totalUsedSheets}`);
  console.log(`📊 Overall Efficiency: ${result.efficiency ? result.efficiency.toFixed(1) : 'N/A'}%`);
  console.log('');
  
  if (result.stockUsage && result.stockUsage.length > 0) {
    let totalPartsPlaced = 0;
    let totalWasteArea = 0;
    
    console.log('📄 SHEET-BY-SHEET ANALYSIS:');
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / sheetArea) * 100).toFixed(1);
      totalPartsPlaced += sheet.placements.length;
      totalWasteArea += sheet.wasteArea;
      
      console.log(`   Sheet ${index + 1}:`);
      console.log(`      Parts: ${sheet.placements.length}`);
      console.log(`      Efficiency: ${efficiency}%`);
      console.log(`      Used Area: ${sheet.usedArea.toLocaleString()}mm²`);
      console.log(`      Waste Area: ${sheet.wasteArea.toLocaleString()}mm²`);
      
      // Flag problematic sheets (like the original 8.1% third sheet)
      if (parseFloat(efficiency) < 30) {
        console.log(`      🚨 LOW EFFICIENCY ALERT: This sheet has very low utilization!`);
      }
      console.log('');
    });
    
    const totalPartsRequired = userParts.reduce((sum, part) => sum + part.quantity, 0);
    const actualEfficiency = result.efficiency || 0;
    
    console.log('📈 PERFORMANCE ANALYSIS:');
    console.log(`   Total parts placed: ${totalPartsPlaced} / ${totalPartsRequired}`);
    
    if (totalPartsPlaced < totalPartsRequired) {
      console.log(`   ❌ CRITICAL: ${totalPartsRequired - totalPartsPlaced} parts not placed!`);
    } else {
      console.log(`   ✅ SUCCESS: All parts successfully placed`);
    }
    
    // Compare against user's original poor performance
    console.log('');
    console.log('🎯 EFFICIENCY IMPROVEMENT ANALYSIS:');
    console.log(`   Current efficiency: ${actualEfficiency.toFixed(1)}%`);
    console.log(`   Original efficiency: 59.1% (user's problematic result)`);
    
    if (actualEfficiency > 59.1) {
      console.log(`   ✅ EFFICIENCY IMPROVED by ${(actualEfficiency - 59.1).toFixed(1)} percentage points!`);
    } else {
      console.log(`   ⚠️  EFFICIENCY ISSUE: Still below original 59.1%`);
    }
    
    console.log('');
    console.log('📦 SHEET UTILIZATION ANALYSIS:');
    console.log(`   Sheets used: ${result.stockUsage.length}`);
    console.log(`   Optimal sheets: ${theoreticalSheets}`);
    
    if (result.stockUsage.length <= theoreticalSheets) {
      console.log(`   ✅ OPTIMAL: Using ${result.stockUsage.length} sheets (meets/beats theoretical optimum)`);
    } else {
      console.log(`   ⚠️  SUBOPTIMAL: Using ${result.stockUsage.length} sheets (${result.stockUsage.length - theoreticalSheets} more than optimal)`);
    }
    
    // Check for the specific issue: low-efficiency third sheet
    if (result.stockUsage.length >= 3) {
      const thirdSheetEfficiency = (result.stockUsage[2].usedArea / sheetArea) * 100;
      console.log(`   📋 Third sheet efficiency: ${thirdSheetEfficiency.toFixed(1)}%`);
      
      if (thirdSheetEfficiency < 30) {
        console.log(`   🚨 THIRD SHEET WASTE ISSUE: Still has low efficiency like original 8.1%`);
      } else {
        console.log(`   ✅ THIRD SHEET IMPROVED: Much better than original 8.1%`);
      }
    } else {
      console.log(`   ✅ NO THIRD SHEET: Eliminated the wasteful third sheet entirely!`);
    }
    
    console.log('');
    console.log('🔧 ALGORITHM PERFORMANCE:');
    console.log(`   Total waste area: ${totalWasteArea.toLocaleString()}mm²`);
    console.log(`   Waste percentage: ${(totalWasteArea / (result.stockUsage.length * sheetArea) * 100).toFixed(1)}%`);
    
    // Success criteria
    const isEfficient = actualEfficiency >= 70;
    const isOptimalSheets = result.stockUsage.length <= theoreticalSheets;
    const hasNoLowEfficiencySheets = result.stockUsage.every(sheet => (sheet.usedArea / sheetArea) >= 0.30);
    
    console.log('');
    console.log('🏆 ENHANCEMENT SUCCESS CRITERIA:');
    console.log(`   ✅ Efficiency ≥70%: ${isEfficient ? 'PASS' : 'FAIL'} (${actualEfficiency.toFixed(1)}%)`);
    console.log(`   ✅ Optimal sheets: ${isOptimalSheets ? 'PASS' : 'FAIL'} (${result.stockUsage.length}/${theoreticalSheets})`);
    console.log(`   ✅ No waste sheets: ${hasNoLowEfficiencySheets ? 'PASS' : 'FAIL'} (all sheets >30%)`);
    
    if (isEfficient && isOptimalSheets && hasNoLowEfficiencySheets) {
      console.log('');
      console.log('🎉 ENHANCEMENT SUCCESS: All efficiency targets met!');
      console.log('   The enhanced algorithms have successfully addressed the user\'s material waste issues.');
    } else {
      console.log('');
      console.log('⚠️  ENHANCEMENT NEEDED: Some targets not met, algorithm needs further tuning.');
    }
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
