/**
 * Test the user's specific scenario with enhanced efficiency algorithms
 * Using calculateOptimalCuts to verify the improvements work
 */

const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');

console.log('🧪 Testing user scenario: 14x 800x400mm + 10x 400x200mm parts');
console.log('Target: Improve from 59.1% overall efficiency and eliminate 8.1% third sheet waste');
console.log('');

// User's actual test case - the problematic scenario
const userStock = [
  {
    length: 2440,
    width: 1220,
    thickness: 18,
    material: 'mdf',
    grainDirection: 'length',
    quantity: 10
  }
];

const userParts = [
  // Large parts (14x 800x400mm) - these were filling 2 sheets at 75% efficiency
  { 
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
  const result = calculateOptimalCuts(userStock, userParts, 2.4);
  
  console.log('📊 OPTIMIZATION RESULTS:');
  console.log(`✅ Success: ${result && result.length > 0}`);
  console.log(`📦 Total Sheets Used: ${result ? result.length : 0}`);
  console.log('');
  
  if (result && result.length > 0) {
    let totalPartsPlaced = 0;
    let totalUsedArea = 0;
    let totalWasteArea = 0;
    
    console.log('📄 SHEET-BY-SHEET ANALYSIS:');
    result.forEach((sheet, index) => {
      const efficiency = sheet.efficiency ? sheet.efficiency.toFixed(1) : '0.0';
      const partsOnSheet = sheet.placements ? sheet.placements.length : 0;
      const usedArea = sheet.usedArea || 0;
      const wasteArea = sheet.wasteArea || (sheetArea - usedArea);
      
      totalPartsPlaced += partsOnSheet;
      totalUsedArea += usedArea;
      totalWasteArea += wasteArea;
      
      console.log(`   Sheet ${index + 1}:`);
      console.log(`      Parts: ${partsOnSheet}`);
      console.log(`      Efficiency: ${efficiency}%`);
      console.log(`      Used Area: ${usedArea.toLocaleString()}mm²`);
      console.log(`      Waste Area: ${wasteArea.toLocaleString()}mm²`);
      
      // Flag problematic sheets (like the original 8.1% third sheet)
      if (parseFloat(efficiency) < 30) {
        console.log(`      🚨 LOW EFFICIENCY ALERT: This sheet has very low utilization!`);
      }
      console.log('');
    });
    
    const totalPartsRequired = userParts.reduce((sum, part) => sum + part.quantity, 0);
    const overallEfficiency = (totalUsedArea / (result.length * sheetArea)) * 100;
    
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
    console.log(`   Current efficiency: ${overallEfficiency.toFixed(1)}%`);
    console.log(`   Original efficiency: 59.1% (user's problematic result)`);
    
    if (overallEfficiency > 59.1) {
      console.log(`   ✅ EFFICIENCY IMPROVED by ${(overallEfficiency - 59.1).toFixed(1)} percentage points!`);
    } else {
      console.log(`   ⚠️  EFFICIENCY ISSUE: Still below original 59.1%`);
    }
    
    console.log('');
    console.log('📦 SHEET UTILIZATION ANALYSIS:');
    console.log(`   Sheets used: ${result.length}`);
    console.log(`   Optimal sheets: ${theoreticalSheets}`);
    
    if (result.length <= theoreticalSheets) {
      console.log(`   ✅ OPTIMAL: Using ${result.length} sheets (meets/beats theoretical optimum)`);
    } else {
      console.log(`   ⚠️  SUBOPTIMAL: Using ${result.length} sheets (${result.length - theoreticalSheets} more than optimal)`);
    }
    
    // Check for the specific issue: low-efficiency third sheet
    if (result.length >= 3) {
      const thirdSheet = result[2];
      const thirdSheetEfficiency = thirdSheet.efficiency || 0;
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
    console.log(`   Waste percentage: ${(totalWasteArea / (result.length * sheetArea) * 100).toFixed(1)}%`);
    
    // Success criteria
    const isEfficient = overallEfficiency >= 70;
    const isOptimalSheets = result.length <= theoreticalSheets;
    const hasNoLowEfficiencySheets = result.every(sheet => (sheet.efficiency || 0) >= 30);
    
    console.log('');
    console.log('🏆 ENHANCEMENT SUCCESS CRITERIA:');
    console.log(`   ✅ Efficiency ≥70%: ${isEfficient ? 'PASS' : 'FAIL'} (${overallEfficiency.toFixed(1)}%)`);
    console.log(`   ✅ Optimal sheets: ${isOptimalSheets ? 'PASS' : 'FAIL'} (${result.length}/${theoreticalSheets})`);
    console.log(`   ✅ No waste sheets: ${hasNoLowEfficiencySheets ? 'PASS' : 'FAIL'} (all sheets >30%)`);
    
    if (isEfficient && isOptimalSheets && hasNoLowEfficiencySheets) {
      console.log('');
      console.log('🎉 ENHANCEMENT SUCCESS: All efficiency targets met!');
      console.log('   The enhanced algorithms have successfully addressed the user\'s material waste issues.');
    } else {
      console.log('');
      console.log('⚠️  ENHANCEMENT NEEDED: Some targets not met, algorithm needs further tuning.');
      
      if (!isEfficient) {
        console.log('   • Efficiency below 70% - need more aggressive space utilization');
      }
      if (!isOptimalSheets) {
        console.log('   • Using more sheets than optimal - need better distribution strategy');
      }
      if (!hasNoLowEfficiencySheets) {
        console.log('   • Low efficiency sheets detected - need to prevent wasteful third sheets');
      }
    }
  } else {
    console.log('❌ No results returned from optimization');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
