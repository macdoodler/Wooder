// Simple test to trace the exact duplicate position issue
import { packParts } from './app/lib/calculateOptimalCuts.js';

console.log("\n=== TESTING PACK_PARTS DUPLICATE POSITION DETECTION ===");

// Simple test setup
const partInstances = [
  { part: { length: 400, width: 300, thickness: 18 }, partIndex: 0, instanceId: 'Part-0-0' },
  { part: { length: 400, width: 300, thickness: 18 }, partIndex: 0, instanceId: 'Part-0-1' },
  { part: { length: 400, width: 300, thickness: 18 }, partIndex: 0, instanceId: 'Part-0-2' }
];

const stock = {
  id: "stock-1",
  type: "plywood", 
  thickness: 18,
  length: 2440,
  width: 1220,
  quantity: 1,
  grainDirection: "length"
};

const kerfThickness = 3;

console.log("Testing 3 parts (400x300mm) on 2440x1220mm sheet...");
console.log("Looking for duplicate position detection...");

try {
  const result = packParts(partInstances, stock, kerfThickness);
  
  console.log(`\nRESULTS:`);
  console.log(`Placements: ${result.placements.length}`);
  console.log(`Used Area: ${result.usedArea}mm²`);
  
  // Check for duplicates
  const positions = new Map();
  let duplicatesFound = false;
  
  result.placements.forEach((placement, index) => {
    const posKey = `${placement.x},${placement.y}`;
    
    if (positions.has(posKey)) {
      console.error(`❌ DUPLICATE FOUND: Position (${placement.x}, ${placement.y})`);
      console.error(`  Part 1: ${positions.get(posKey)}`);
      console.error(`  Part 2: ${placement.partId}`);
      duplicatesFound = true;
    } else {
      positions.set(posKey, placement.partId);
    }
    
    console.log(`  Part ${index + 1}: ${placement.partId} at (${placement.x}, ${placement.y}) rotated: ${placement.rotated}`);
  });
  
  if (!duplicatesFound) {
    console.log(`✅ No duplicates found in packParts result`);
  }
  
} catch (error) {
  console.error("Error:", error.message);
}

console.log("\n=== TEST COMPLETE ===");
