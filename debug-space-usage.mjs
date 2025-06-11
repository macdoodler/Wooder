// Debug script to analyze space usage and placement
// Run with: npx tsx debug-space-usage.mjs

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts.ts';

console.log("🔍 SPACE USAGE DEBUG ANALYSIS");
console.log("===============================");

// Simple test with just keith parts to see maximum fit
const keithOnlyStock = [
  {
    name: "Keith Only Sheet",
    length: 2440,
    width: 1220, 
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "horizontal"
  }
];

const keithOnlyParts = [
  {
    name: "keith",
    length: 200,
    width: 200,
    thickness: 18, 
    material: "Plywood",
    quantity: 72, // Should fit 12×6=72 parts theoretically
    grainDirection: "horizontal"
  }
];

const kerfThickness = 2.4;

console.log("📐 Theoretical calculation:");
console.log("- Keith part: 200×200mm + 2.4mm kerf = 202.4×202.4mm");
console.log("- Sheet: 2440×1220mm");
console.log("- Parts across: 2440 ÷ 202.4 = 12.06 → 12 parts");
console.log("- Parts down: 1220 ÷ 202.4 = 6.03 → 6 parts");
console.log("- Total theoretical: 12×6 = 72 parts");

try {
  console.log("\n🚀 Testing keith-only optimization...");
  const keithResults = calculateOptimalCuts(keithOnlyStock, keithOnlyParts, kerfThickness);
  
  if (!keithResults.success) {
    console.error("❌ Keith-only optimization failed:", keithResults.message);
  } else {
    const sheet = keithResults.stockUsage?.[0];
    if (sheet) {
      console.log(`\n📊 Keith-only results:`);
      console.log(`- Parts placed: ${sheet.placements.length}/72`);
      console.log(`- Efficiency: ${((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1)}%`);
      console.log(`- Waste: ${((sheet.wasteArea / (2440 * 1220)) * 100).toFixed(1)}%`);
      
      if (sheet.placements.length < 60) {
        console.error("❌ SIGNIFICANT UNDERUTILIZATION!");
        console.error(`Expected ~72 parts, got ${sheet.placements.length}`);
        
        // Analyze the pattern
        console.log("\n🔍 Placement pattern analysis:");
        const maxX = Math.max(...sheet.placements.map(p => p.x));
        const maxY = Math.max(...sheet.placements.map(p => p.y));
        console.log(`Max X position: ${maxX.toFixed(1)}mm`);
        console.log(`Max Y position: ${maxY.toFixed(1)}mm`);
        console.log(`X utilization: ${((maxX + 202.4) / 2440 * 100).toFixed(1)}%`);
        console.log(`Y utilization: ${((maxY + 202.4) / 1220 * 100).toFixed(1)}%`);
        
        // Check for gaps in the grid
        const gridCounts = {};
        sheet.placements.forEach(p => {
          const gridX = Math.round(p.x / 202.4);
          const gridY = Math.round(p.y / 202.4);
          const key = `${gridX},${gridY}`;
          gridCounts[key] = (gridCounts[key] || 0) + 1;
        });
        
        console.log(`\nGrid positions used: ${Object.keys(gridCounts).length}`);
        const duplicates = Object.values(gridCounts).filter(count => count > 1);
        if (duplicates.length > 0) {
          console.error(`❌ Duplicate positions detected: ${duplicates.length}`);
        }
      }
    }
  }
  
  console.log("\n" + "=".repeat(50));
  
  // Now test the original mixed scenario
  console.log("\n🔄 Testing mixed bob+keith scenario...");
  
  const mixedStock = [
    {
      name: "Mixed Sheet",
      length: 2440,
      width: 1220, 
      thickness: 18,
      material: "Plywood",
      quantity: 1,
      grainDirection: "horizontal"
    }
  ];
  
  const mixedParts = [
    {
      name: "bob",
      length: 800,
      width: 400, 
      thickness: 18,
      material: "Plywood",
      quantity: 4,
      grainDirection: "horizontal"
    },
    {
      name: "keith",
      length: 200,
      width: 200,
      thickness: 18, 
      material: "Plywood",
      quantity: 20, // Just test with 20 to see if more fit
      grainDirection: "horizontal"
    }
  ];
  
  const mixedResults = calculateOptimalCuts(mixedStock, mixedParts, kerfThickness);
  
  if (mixedResults.success && mixedResults.stockUsage?.[0]) {
    const sheet = mixedResults.stockUsage[0];
    const bobPlacements = sheet.placements.filter(p => p.name === "bob");
    const keithPlacements = sheet.placements.filter(p => p.name === "keith");
    
    console.log(`\n📊 Mixed results:`);
    console.log(`- Bob parts: ${bobPlacements.length}/4`);
    console.log(`- Keith parts: ${keithPlacements.length}/20`);
    console.log(`- Total: ${sheet.placements.length}/24`);
    console.log(`- Efficiency: ${((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1)}%`);
    
    if (keithPlacements.length < 15) {
      console.error("❌ Poor keith placement in mixed scenario!");
      
      // Calculate remaining space after bob parts
      const bobUsedArea = bobPlacements.length * 800 * 400;
      const remainingArea = (2440 * 1220) - bobUsedArea;
      const keithArea = 200 * 200;
      const theoreticalKeithFit = Math.floor(remainingArea / keithArea);
      
      console.log(`\n📐 Space analysis after bob placement:`);
      console.log(`- Bob used area: ${bobUsedArea.toLocaleString()}mm²`);
      console.log(`- Remaining area: ${remainingArea.toLocaleString()}mm²`);
      console.log(`- Theoretical keith fit: ${theoreticalKeithFit} parts`);
      console.log(`- Actual keith fit: ${keithPlacements.length} parts`);
      console.log(`- Space utilization: ${(keithPlacements.length / theoreticalKeithFit * 100).toFixed(1)}%`);
    }
  }
  
} catch (error) {
  console.error("❌ Debug failed:", error.message);
  process.exit(1);
}
