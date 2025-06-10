/**
 * STRIP-CUTTING OPTIMIZATION TEST
 * This test verifies that small parts use strip-cutting instead of grid alignment
 */

const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');

// Test scenario: Large parts + small parts (from your real example)
const testParts = [
  { 
    partIndex: 0, 
    length: 800, 
    width: 400, 
    quantity: 6, // Fewer large parts to see the strip-cutting effect clearly
    material: 'plywood',
    thickness: 18,
    grainDirection: 'vertical',
    name: 'Cabinet Sides'
  },
  { 
    partIndex: 1, 
    length: 200, 
    width: 200, 
    quantity: 10, // More small parts to demonstrate strip-cutting
    material: 'plywood',
    thickness: 18,
    grainDirection: 'vertical',
    name: 'Small Parts'
  }
];

const testStock = [
  {
    id: 'sheet1',
    width: 1220,
    length: 2440,
    thickness: 18,
    materialType: 'sheet',
    material: 'plywood',
    quantity: 3,
    cost: 80,
    grainDirection: 'horizontal'
  }
];

console.log('🧪 TESTING STRIP-CUTTING OPTIMIZATION');
console.log('=====================================');
console.log('📊 Parts: 6x 800x400mm + 10x 200x200mm');
console.log('📦 Stock: 2440x1220mm sheets');
console.log('🎯 Expected: Small parts should use strip-cutting for better efficiency');
console.log('');

try {
  const result = calculateOptimalCuts(testStock, testParts, 2.4);
  
  console.log('📈 RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Sheets Used: ${result.stockUsage ? result.stockUsage.length : 0}`);
  console.log('');
  
  if (result.stockUsage && result.stockUsage.length > 0) {
    result.stockUsage.forEach((sheet, index) => {
      const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1);
      console.log(`📄 Sheet ${index + 1}:`);
      console.log(`   Parts Placed: ${sheet.placements.length}`);
      console.log(`   Efficiency: ${efficiency}%`);
      console.log(`   Used Area: ${sheet.usedArea.toLocaleString()}mm²`);
      
      // Analyze small part placement patterns
      const largeParts = sheet.placements.filter(p => p.partId.includes('Part-0-'));
      const smallParts = sheet.placements.filter(p => p.partId.includes('Part-1-'));
      
      console.log(`   Large parts (${largeParts.length}): Cabinet Sides`);
      console.log(`   Small parts (${smallParts.length}): Small Parts`);
      
      if (smallParts.length > 0) {
        console.log(`   Small part positions:`);
        smallParts.forEach((part, idx) => {
          console.log(`     ${part.partId}: (${part.x}, ${part.y})`);
        });
        
        // Analyze strip-cutting effectiveness
        const stripAnalysis = analyzeStripCutting(smallParts);
        console.log(`   Strip-cutting analysis:`);
        console.log(`     Continuous strips detected: ${stripAnalysis.strips}`);
        console.log(`     Grid-aligned parts: ${stripAnalysis.gridAligned}/${smallParts.length}`);
        console.log(`     Strip efficiency: ${stripAnalysis.efficiency}%`);
        
        if (stripAnalysis.efficiency > 70) {
          console.log(`   ✅ STRIP-CUTTING WORKING: Good continuous placement`);
        } else {
          console.log(`   ⚠️  IMPROVEMENT NEEDED: Still too much grid alignment`);
        }
      }
      console.log('');
    });
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}

/**
 * Analyze how well parts are using strip-cutting vs grid alignment
 */
function analyzeStripCutting(smallParts) {
  if (smallParts.length === 0) return { strips: 0, gridAligned: 0, efficiency: 0 };
  
  let strips = 0;
  let gridAligned = 0;
  let continuousPairs = 0;
  
  // Check for continuous placement (parts adjacent to each other)
  for (let i = 0; i < smallParts.length; i++) {
    const part = smallParts[i];
    
    // Check if this part is grid-aligned (multiples of ~402mm for large part spacing)
    const gridSpacing = 402.4; // Large part width + kerf
    if (Math.abs(part.x % gridSpacing) < 10 || Math.abs((part.x % gridSpacing) - gridSpacing) < 10) {
      gridAligned++;
    }
    
    // Check for adjacent parts (continuous strips)
    for (let j = i + 1; j < smallParts.length; j++) {
      const other = smallParts[j];
      const xDiff = Math.abs(part.x - other.x);
      const yDiff = Math.abs(part.y - other.y);
      
      // Parts are adjacent if they're ~202.4mm apart (part width + kerf)
      if ((xDiff > 200 && xDiff < 210 && yDiff < 5) || // Horizontal adjacency
          (yDiff > 200 && yDiff < 210 && xDiff < 5)) { // Vertical adjacency
        continuousPairs++;
      }
    }
  }
  
  // Estimate number of strips (groups of adjacent parts)
  strips = Math.ceil(continuousPairs / 2);
  
  // Calculate efficiency (less grid alignment = better strip cutting)
  const efficiency = Math.max(0, 100 - (gridAligned / smallParts.length) * 100);
  
  return {
    strips: strips,
    gridAligned: gridAligned,
    efficiency: Math.round(efficiency)
  };
}
