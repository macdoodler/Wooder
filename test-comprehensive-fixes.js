const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');

// Test comprehensive collision detection fixes
console.log('=== TESTING COMPREHENSIVE COLLISION DETECTION FIXES ===\n');

// Test Case 1: Multiple parts that previously caused overlaps
const testCase1 = {
  availableStocks: [
    {
      id: 'sheet1',
      width: 2440,
      height: 1220,
      thickness: 18,
      material: 'MDF',
      grainDirection: 'none',
      count: 2
    }
  ],
  requiredParts: [
    { id: 'part1', width: 400, height: 200, thickness: 18, material: 'MDF', quantity: 3, name: 'Shelf' },
    { id: 'part2', width: 300, height: 150, thickness: 18, material: 'MDF', quantity: 4, name: 'Side Panel' },
    { id: 'part3', width: 500, height: 250, thickness: 18, material: 'MDF', quantity: 2, name: 'Back Panel' },
    { id: 'part4', width: 200, height: 100, thickness: 18, material: 'MDF', quantity: 6, name: 'Divider' }
  ],
  kerfThickness: 3.2
};

console.log('Test Case 1: Multiple small parts (previously caused overlaps)');
try {
  const result1 = calculateOptimalCuts(
    testCase1.availableStocks,
    testCase1.requiredParts,
    testCase1.kerfThickness
  );
  
  console.log('✅ Algorithm completed without errors');
  console.log(`Sheets used: ${result1.sheetUsage.length}`);
  console.log(`Total efficiency: ${result1.totalEfficiency.toFixed(2)}%`);
  console.log(`Total waste: ${result1.totalWasteArea.toFixed(0)} mm²`);
  
  // Check for overlapping placements
  let hasOverlaps = false;
  let totalPlacements = 0;
  
  result1.sheetUsage.forEach((sheet, sheetIndex) => {
    console.log(`\nSheet ${sheetIndex + 1} (${sheet.stockId}):`);
    console.log(`  Placements: ${sheet.placements.length}`);
    console.log(`  Efficiency: ${sheet.efficiency.toFixed(2)}%`);
    
    totalPlacements += sheet.placements.length;
    
    // Check for duplicate positions
    const positions = new Map();
    sheet.placements.forEach((placement, i) => {
      const posKey = `${placement.x},${placement.y}`;
      if (positions.has(posKey)) {
        console.error(`❌ OVERLAP DETECTED: Parts at position (${placement.x}, ${placement.y})`);
        console.error(`  Part 1: ${positions.get(posKey).partId} (${positions.get(posKey).width}x${positions.get(posKey).height})`);
        console.error(`  Part 2: ${placement.partId} (${placement.width}x${placement.height})`);
        hasOverlaps = true;
      } else {
        positions.set(posKey, placement);
      }
      
      // Check for geometric overlaps
      for (let j = i + 1; j < sheet.placements.length; j++) {
        const other = sheet.placements[j];
        const overlap = !(
          placement.x + placement.width <= other.x ||
          other.x + other.width <= placement.x ||
          placement.y + placement.height <= other.y ||
          other.y + other.height <= placement.y
        );
        
        if (overlap) {
          console.error(`❌ GEOMETRIC OVERLAP: ${placement.partId} and ${other.partId}`);
          console.error(`  ${placement.partId}: (${placement.x}, ${placement.y}) ${placement.width}x${placement.height}`);
          console.error(`  ${other.partId}: (${other.x}, ${other.y}) ${other.width}x${other.height}`);
          hasOverlaps = true;
        }
      }
    });
  });
  
  if (!hasOverlaps) {
    console.log('\n✅ NO OVERLAPS DETECTED - Collision detection working correctly!');
  }
  
  // Check for impossible metrics
  if (result1.totalEfficiency > 100) {
    console.error(`❌ IMPOSSIBLE EFFICIENCY: ${result1.totalEfficiency.toFixed(2)}% (>100%)`);
  } else {
    console.log(`✅ Valid efficiency: ${result1.totalEfficiency.toFixed(2)}%`);
  }
  
  if (result1.totalWasteArea < 0) {
    console.error(`❌ NEGATIVE WASTE: ${result1.totalWasteArea.toFixed(0)} mm²`);
  } else {
    console.log(`✅ Valid waste area: ${result1.totalWasteArea.toFixed(0)} mm²`);
  }
  
  console.log(`\nTotal placements made: ${totalPlacements}`);
  console.log(`Expected placements: ${testCase1.requiredParts.reduce((sum, part) => sum + part.quantity, 0)}`);
  
} catch (error) {
  console.error('❌ Test failed with error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Test Case 2: Large parts that might force tight packing
const testCase2 = {
  availableStocks: [
    {
      id: 'sheet1',
      width: 2440,
      height: 1220,
      thickness: 18,
      material: 'MDF',
      grainDirection: 'none',
      count: 1
    }
  ],
  requiredParts: [
    { id: 'large1', width: 800, height: 600, thickness: 18, material: 'MDF', quantity: 2, name: 'Large Panel' },
    { id: 'medium1', width: 600, height: 400, thickness: 18, material: 'MDF', quantity: 2, name: 'Medium Panel' },
    { id: 'small1', width: 300, height: 200, thickness: 18, material: 'MDF', quantity: 4, name: 'Small Panel' }
  ],
  kerfThickness: 3.2
};

console.log('Test Case 2: Mixed large and small parts (tight packing scenario)');
try {
  const result2 = calculateOptimalCuts(
    testCase2.availableStocks,
    testCase2.requiredParts,
    testCase2.kerfThickness
  );
  
  console.log('✅ Algorithm completed without errors');
  console.log(`Sheets used: ${result2.sheetUsage.length}`);
  console.log(`Total efficiency: ${result2.totalEfficiency.toFixed(2)}%`);
  
  // Quick overlap check
  let hasOverlaps = false;
  result2.sheetUsage.forEach((sheet, sheetIndex) => {
    const positions = new Set();
    sheet.placements.forEach(placement => {
      const posKey = `${placement.x},${placement.y}`;
      if (positions.has(posKey)) {
        console.error(`❌ DUPLICATE POSITION on sheet ${sheetIndex + 1}: (${placement.x}, ${placement.y})`);
        hasOverlaps = true;
      }
      positions.add(posKey);
    });
  });
  
  if (!hasOverlaps) {
    console.log('✅ No duplicate positions detected');
  }
  
} catch (error) {
  console.error('❌ Test failed with error:', error.message);
}

console.log('\n=== COLLISION DETECTION TEST COMPLETE ===');
