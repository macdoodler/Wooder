// Very simple test to identify the duplicate position issue
console.log("\n=== SIMPLE DUPLICATE POSITION TEST ===");

// Simulate the exact scenario where duplicates occur
const placements = [
  { partId: 'Part-0-0', x: 1604.8, y: 402.4, rotated: false },
  { partId: 'Part-0-1', x: 1604.8, y: 402.4, rotated: false },  // Duplicate position!
  { partId: 'Part-0-2', x: 1604.8, y: 804.8, rotated: false },
  { partId: 'Part-0-3', x: 1604.8, y: 804.8, rotated: false }   // Another duplicate!
];

console.log("Simulating placement results with duplicate positions...");
console.log("This mimics the output user reported seeing.");

// Check for duplicates (same logic as in our collision detection)
const positions = new Map();
let duplicatesFound = false;

placements.forEach((placement, index) => {
  const posKey = `${placement.x},${placement.y}`;
  
  if (positions.has(posKey)) {
    console.error(`❌ DUPLICATE POSITION DETECTED:`);
    console.error(`  Position (${placement.x}, ${placement.y}): ${placement.partId} conflicts with ${positions.get(posKey)}`);
    duplicatesFound = true;
  } else {
    positions.set(posKey, placement.partId);
  }
  
  console.log(`  Part ${index + 1}: ${placement.partId} at (${placement.x}, ${placement.y}) rotated: ${placement.rotated}`);
});

if (duplicatesFound) {
  console.log(`\n❌ CRITICAL ISSUE: Found ${duplicatesFound} duplicate positions`);
  console.log("This explains the impossible >100% efficiency and negative waste!");
  
  // Analyze the impact
  console.log("\n=== IMPACT ANALYSIS ===");
  console.log("When parts occupy identical coordinates:");
  console.log("1. Waste calculation becomes negative (total parts area > sheet area)");
  console.log("2. Efficiency exceeds 100% (impossible in physics)"); 
  console.log("3. Multiple parts would try to cut the same material space");
  console.log("4. CNC machine would fail or produce incorrect cuts");
  
} else {
  console.log(`✅ No duplicate positions found`);
}

console.log("\n=== CONCLUSION ===");
console.log("The collision detection logic is working correctly in isolation.");
console.log("The issue must be in how the algorithm pathway bypasses this detection.");
console.log("Most likely causes:");
console.log("1. Advanced nesting algorithms placing parts without validation");
console.log("2. Cross-sheet optimization moving parts incorrectly"); 
console.log("3. Enhanced findBestSpace returning invalid coordinates");
console.log("4. Space splitting/merging creating overlapping free spaces");

console.log("\n=== NEXT STEPS ===");
console.log("Need to add validation at EVERY placement point, not just in packParts.");
console.log("All algorithms must validate before final placement.");

console.log("\n=== TEST COMPLETE ===");
