// Test to reproduce exact duplicate position issue
import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts.js';

console.log("\n=== TESTING EXACT DUPLICATE POSITION SCENARIO ===");

// Test with a scenario that might reproduce the duplicate positions at (1604.8, 402.4) and (1604.8, 804.8)
const availableStocks = [
  {
    id: "stock-1",
    type: "plywood",
    thickness: 18,
    length: 2440,
    width: 1220,
    quantity: 10,
    grainDirection: "length"
  }
];

const requiredParts = [
  { length: 400, width: 300, thickness: 18, name: "Part A", grainDirection: "length" },
  { length: 400, width: 300, thickness: 18, name: "Part B", grainDirection: "length" },
  { length: 400, width: 300, thickness: 18, name: "Part C", grainDirection: "length" },
  { length: 400, width: 300, thickness: 18, name: "Part D", grainDirection: "length" },
  { length: 400, width: 300, thickness: 18, name: "Part E", grainDirection: "length" },
  { length: 400, width: 300, thickness: 18, name: "Part F", grainDirection: "length" }
];

const kerfThickness = 3;

console.log("Testing with 6 identical parts (400x300mm) on 2440x1220mm sheet...");
console.log("This should trigger cross-sheet optimization and potential reorganization");

try {
  const results = calculateOptimalCuts(availableStocks, requiredParts, kerfThickness);
  
  console.log("\n=== ANALYZING RESULTS ===");
  
  if (results && results.length > 0) {
    results.forEach((result, sheetIndex) => {
      console.log(`\nSheet ${sheetIndex + 1}:`);
      console.log(`  Stock: ${result.stock.length}x${result.stock.width}mm`);
      console.log(`  Placements: ${result.placements.length}`);
      console.log(`  Waste: ${result.wasteArea}mm²`);
      console.log(`  Efficiency: ${result.efficiency}%`);
      
      // Check for duplicate positions
      const positions = new Map();
      let duplicatesFound = false;
      
      result.placements.forEach((placement, index) => {
        const posKey = `${placement.x},${placement.y}`;
        
        if (positions.has(posKey)) {
          console.error(`  ❌ DUPLICATE POSITION FOUND:`);
          console.error(`    Position (${placement.x}, ${placement.y}): ${placement.partId} conflicts with ${positions.get(posKey)}`);
          duplicatesFound = true;
        } else {
          positions.set(posKey, placement.partId);
        }
        
        console.log(`    Part ${index + 1}: ${placement.partId} at (${placement.x}, ${placement.y}) rotated: ${placement.rotated}`);
      });
      
      if (!duplicatesFound) {
        console.log(`  ✅ No duplicate positions found on this sheet`);
      }
    });
    
    // Check for impossible efficiency/waste
    const firstSheet = results[0];
    if (firstSheet.efficiency > 100) {
      console.error(`\n❌ IMPOSSIBLE EFFICIENCY: ${firstSheet.efficiency}% > 100%`);
    }
    if (firstSheet.wasteArea < 0) {
      console.error(`\n❌ NEGATIVE WASTE: ${firstSheet.wasteArea}mm²`);
    }
    
  } else {
    console.error("No results returned from calculateOptimalCuts");
  }
  
} catch (error) {
  console.error("Error during calculation:", error);
  console.error("Stack trace:", error.stack);
}

console.log("\n=== TEST COMPLETE ===");
