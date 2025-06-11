// Direct collision detection test
// Run with: npx tsx collision-test-direct.mjs

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts';

console.log("🔧 COLLISION DETECTION FIX TEST");
console.log("================================");

// Test data - 5 identical parts that were causing overlaps  
const testStock = [
  {
    name: "Test Sheet",
    length: 2440,
    width: 1220,
    thickness: 18,
    material: "Plywood", 
    quantity: 1,
    grainDirection: "lengthwise"
  }
];

const testParts = [
  { name: "keith", length: 300, width: 200, thickness: 18, material: "Plywood", quantity: 5, grainDirection: "any" }
];

console.log("📊 Test Configuration:");
console.log("- Stock: 2440x1220x18mm Plywood sheet");
console.log("- Parts: 5x keith parts (300x200x18mm each)");
console.log("- Kerf: 3.175mm");

try {
  console.log("\n🚀 Running optimization...");
  const results = calculateOptimalCuts(testStock, testParts, 3.175);
  
  if (!results.success) {
    console.error("❌ Optimization failed:", results.message);
    process.exit(1);
  }
  
  console.log("✨ Optimization completed successfully!");
  
  // Check for overlaps
  let hasOverlaps = false;
  let totalPlacements = 0;
  
  console.log("\n🔍 Analyzing placements for overlaps...");
  
  if (results.stockUsage && results.stockUsage.length > 0) {
    results.stockUsage.forEach((sheet, sheetIndex) => {
      const placements = sheet.placements;
      totalPlacements += placements.length;
      
      console.log(`\n📋 Sheet ${sheetIndex + 1}: ${placements.length} placements`);
      
      // List all placements
      placements.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.name}: (${p.x}, ${p.y}) rotated: ${p.rotated}`);
      });
      
      // Check for overlaps between all pairs
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const p1 = placements[i];
          const p2 = placements[j];
          
          // Calculate bounds for 300x200 parts
          const p1Right = p1.x + 300;
          const p1Bottom = p1.y + 200;
          const p2Right = p2.x + 300;
          const p2Bottom = p2.y + 200;
          
          // Check for overlap with small tolerance
          const TOLERANCE = 0.01;
          const xOverlap = !(p1Right <= p2.x + TOLERANCE || p1.x >= p2Right - TOLERANCE);
          const yOverlap = !(p1Bottom <= p2.y + TOLERANCE || p1.y >= p2Bottom - TOLERANCE);
          
          if (xOverlap && yOverlap) {
            console.error(`  ❌ OVERLAP: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
            hasOverlaps = true;
          } else {
            console.log(`  ✅ OK: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
          }
        }
      }
    });
  } else if (results.usedSheets) {
    // Fallback for different result structure
    results.usedSheets.forEach((sheet, sheetIndex) => {
      const placements = sheet.placements;
      totalPlacements += placements.length;
      
      console.log(`\n📋 Sheet ${sheetIndex + 1}: ${placements.length} placements`);
      
      // List all placements
      placements.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.name}: (${p.x}, ${p.y}) rotated: ${p.rotated}`);
      });
      
      // Check for overlaps between all pairs
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const p1 = placements[i];
          const p2 = placements[j];
          
          // Calculate bounds for 300x200 parts
          const p1Right = p1.x + 300;
          const p1Bottom = p1.y + 200;
          const p2Right = p2.x + 300;
          const p2Bottom = p2.y + 200;
          
          // Check for overlap with small tolerance
          const TOLERANCE = 0.01;
          const xOverlap = !(p1Right <= p2.x + TOLERANCE || p1.x >= p2Right - TOLERANCE);
          const yOverlap = !(p1Bottom <= p2.y + TOLERANCE || p1.y >= p2Bottom - TOLERANCE);
          
          if (xOverlap && yOverlap) {
            console.error(`  ❌ OVERLAP: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
            hasOverlaps = true;
          } else {
            console.log(`  ✅ OK: ${p1.name} at (${p1.x}, ${p1.y}) vs ${p2.name} at (${p2.x}, ${p2.y})`);
          }
        }
      }
    });
  }
  
  console.log(`\n📈 FINAL RESULTS:`);
  console.log(`Total placements: ${totalPlacements}`);
  console.log(`Parts successfully placed: ${totalPlacements}/5`);
  
  if (hasOverlaps) {
    console.error("\n❌ COLLISION DETECTION FIX FAILED");
    console.error("🚨 Parts are still overlapping!");
    console.error("💥 The collision detection system needs further debugging.");
    process.exit(1);
  } else {
    console.log("\n✅ COLLISION DETECTION FIX SUCCESS");
    console.log("🎉 No overlaps detected!");
    console.log("🔧 The collision detection fix is working correctly.");
  }
  
  // Additional analysis
  if (results.materialEfficiency) {
    console.log(`\n📊 Efficiency Metrics:`);
    console.log(`- Material efficiency: ${(results.materialEfficiency * 100).toFixed(1)}%`);
  }
  
} catch (error) {
  console.error("❌ Test failed with error:", error.message);
  console.error("🔍 Stack trace:", error.stack);
  process.exit(1);
}
