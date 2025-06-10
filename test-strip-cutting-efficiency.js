const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');

// Test case: Demonstrates the strip-cutting inefficiency issue
// 28 large parts + 19 small parts from your UI example
const testParts = [
  { 
    partIndex: 0, 
    length: 800, 
    width: 400, 
    quantity: 28,
    material: 'plywood',
    thickness: 18,
    grainDirection: 'vertical', // Grain along length (800mm)
    priority: 1,
    name: 'Cabinet Sides'
  },
  { 
    partIndex: 1, 
    length: 200, 
    width: 200, 
    quantity: 19,
    material: 'plywood',
    thickness: 18,
    grainDirection: 'vertical', // Grain along length (200mm) 
    priority: 1,
    name: 'test'
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
    quantity: 8,
    cost: 80,
    grainDirection: 'horizontal' // Grain along 2440mm length
  }
];

console.log('🔧 TESTING STRIP-CUTTING EFFICIENCY ISSUE');
console.log('📊 Parts: 28x 800x400mm Cabinet Sides + 19x 200x200mm test parts');
console.log('📦 Stock: 2440x1220mm sheets with horizontal grain');
console.log('🎯 Issue: Small parts align to large part grid instead of using strip-cutting');
console.log('');

try {
  const result = calculateOptimalCuts(testStock, testParts, 2.4);
  
  console.log('📈 RESULTS:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📋 Message: ${result.message}`);
  console.log(`📦 Sheets Used: ${result.totalUsedSheets}`);
  console.log(`🎯 Overall Efficiency: ${((result.totalUsedArea / (result.totalUsedSheets * 2440 * 1220)) * 100).toFixed(1)}%`);
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
      const partCounts = {};
      sheet.placements.forEach(placement => {
        const partType = placement.partId.includes('Part-0-') ? 'Cabinet Sides (800x400)' : 'test (200x200)';
        partCounts[partType] = (partCounts[partType] || 0) + 1;
      });
      console.log(`   Part breakdown:`, partCounts);
      
      // Analyze placement pattern for small parts
      const smallParts = sheet.placements.filter(p => p.partId.includes('Part-1-'));
      if (smallParts.length > 0) {
        console.log(`   Small part positions:`);
        smallParts.forEach(part => {
          console.log(`     ${part.partId}: (${part.x}, ${part.y})`);
        });
        
        // Check for grid alignment issue
        const alignedToGrid = smallParts.filter(part => {
          // Check if position aligns to 402.4mm grid (large part width + kerf)
          const gridSpacing = 402.4;
          const xAlignment = Math.abs(part.x % gridSpacing) < 5 || Math.abs((part.x % gridSpacing) - gridSpacing) < 5;
          return xAlignment;
        });
        
        if (alignedToGrid.length > smallParts.length * 0.7) {
          console.log(`   ⚠️  ISSUE DETECTED: ${alignedToGrid.length}/${smallParts.length} small parts aligned to large part grid`);
          console.log(`       This indicates inefficient grid-based placement instead of strip-cutting`);
        }
      }
      console.log('');
    });
    
    console.log('🔍 ANALYSIS:');
    console.log('Expected behavior for optimal strip-cutting:');
    console.log('- Small 200x200mm parts should cluster together in strips');
    console.log('- Multiple small parts should fit between large part boundaries');
    console.log('- Less grid alignment, more continuous placement');
    console.log('');
    console.log('Current behavior (problematic):');
    console.log('- Small parts positioned at regular grid intervals');
    console.log('- Wasted space between small parts');
    console.log('- Missed opportunities for rip-cutting efficiency');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}
