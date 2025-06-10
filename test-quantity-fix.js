// Quick test to verify quantity handling fix
const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts');
const { MaterialType } = require('./app/lib/types');

// Mock window for Node.js environment
global.window = { DEBUG_CUTTING: false };

console.log('🧪 Testing Quantity Handling Fix');
console.log('==============================');

// Test data - multiple quantities
const stocks = [
  {
    id: "stock-1",
    length: 1200,
    width: 800,
    thickness: 18,
    quantity: 2,
    material: "Plywood",
    materialType: MaterialType.Sheet,
    grainDirection: "horizontal"
  }
];

const parts = [
  {
    name: "Test Part 1",
    length: 300,
    width: 200,
    thickness: 18,
    quantity: 3, // Should place 3 instances
    material: "Plywood",
    materialType: MaterialType.Sheet,
    grainDirection: "horizontal"
  },
  {
    name: "Test Part 2",
    length: 250,
    width: 150,
    thickness: 18,
    quantity: 2, // Should place 2 instances
    material: "Plywood",
    materialType: MaterialType.Sheet,
    grainDirection: "horizontal"
  }
];

console.log('\n📊 Input Data:');
console.log(`Stocks: ${stocks.length} type(s)`);
console.log(`Parts: ${parts.length} type(s), ${parts.reduce((sum, p) => sum + p.quantity, 0)} total instances`);

try {
  const result = calculateOptimalCuts(stocks, parts, 3.2);
  
  console.log('\n✅ Results:');
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.message}`);
  console.log(`Sheets used: ${result.totalUsedSheets}`);
  console.log(`Stock usage entries: ${result.stockUsage.length}`);
  
  // Count total placements
  const totalPlacements = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
  console.log(`Total placements: ${totalPlacements}`);
  
  // Detail placements by part type
  console.log('\n📋 Placement Details:');
  result.stockUsage.forEach((usage, sheetIndex) => {
    console.log(`\nSheet ${sheetIndex + 1}:`);
    usage.placements.forEach(placement => {
      console.log(`  - ${placement.partId} at (${placement.x}, ${placement.y}) ${placement.rotated ? '(rotated)' : ''}`);
    });
  });
  
  // Verify we got the expected number of placements
  const expectedTotal = parts.reduce((sum, p) => sum + p.quantity, 0);
  if (totalPlacements === expectedTotal) {
    console.log(`\n�� SUCCESS: All ${expectedTotal} parts were placed correctly!`);
  } else {
    console.log(`\n❌ ISSUE: Expected ${expectedTotal} placements, but got ${totalPlacements}`);
  }
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
}
