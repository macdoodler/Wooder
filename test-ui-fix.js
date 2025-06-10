// Test script to verify the UI fix is working
const { calculateOptimalCuts } = require('./app/lib/calculateOptimalCuts.ts');

// Test case: Simple inventory scenario
const availableStocks = [
  {
    length: 2400,
    width: 1200,
    thickness: 18,
    quantity: 2,
    material: "Plywood",
    materialType: "Sheet",
    grainDirection: ""
  },
  {
    length: 1200,
    width: 600,
    thickness: 18,
    quantity: 3,
    material: "Plywood", 
    materialType: "Sheet",
    grainDirection: ""
  }
];

const requiredParts = [
  {
    length: 800,
    width: 400,
    thickness: 18,
    quantity: 4,
    material: "Plywood",
    materialType: "Sheet",
    grainDirection: "",
    name: "Shelf"
  },
  {
    length: 600,
    width: 300,
    thickness: 18,
    quantity: 2,
    material: "Plywood",
    materialType: "Sheet", 
    grainDirection: "",
    name: "Side Panel"
  }
];

console.log('=== Testing Inventory-First Optimization ===');
console.log('Available Stocks:', availableStocks.length);
console.log('Required Parts:', requiredParts.length);

try {
  const results = calculateOptimalCuts(availableStocks, requiredParts, 3);
  
  if (results.success) {
    console.log('✅ SUCCESS: Calculation completed');
    console.log('📊 Results Summary:');
    console.log(`  - Success: ${results.success}`);
    console.log(`  - Message: ${results.message}`);
    console.log(`  - Sheets Used: ${results.totalUsedSheets}`);
    console.log(`  - Stock Usage: ${results.stockUsage.length} sheets`);
    console.log(`  - Total Waste: ${Math.round(results.totalWaste)}mm²`);
    
    if (results.cutSequences) {
      console.log(`  - Cut Sequences: ${results.cutSequences.length} sequences`);
    }
    
    results.stockUsage.forEach((usage, index) => {
      console.log(`  📋 Sheet ${index + 1}: ${usage.placements.length} parts placed`);
    });
    
  } else {
    console.log('❌ FAILED:', results.message);
  }
  
} catch (error) {
  console.error('💥 ERROR:', error.message);
}
