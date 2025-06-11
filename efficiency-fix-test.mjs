// Test the efficiency fix
// Run with: npx tsx efficiency-fix-test.mjs

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts';

console.log("🔧 EFFICIENCY FIX TEST");
console.log("=======================");

// Test data - exactly what should fit in a 3x3 grid
const testStock = [
  {
    name: "Test Sheet",
    length: 2440,
    width: 1220, 
    thickness: 18,
    material: "Plywood",
    quantity: 1,
    grainDirection: "horizontal"
  }
];

const testParts = [
  {
    name: "Cabinet Sides",
    length: 800,
    width: 400, 
    thickness: 18,
    material: "Plywood",
    quantity: 9, // Should all fit on one sheet
    grainDirection: "horizontal"
  }
];

const kerfThickness = 2.4;

console.log("📊 Test Configuration:");
console.log("- Sheet: 2440×1220×18mm");
console.log("- Parts: 9×800×400×18mm");
console.log("- Kerf: 2.4mm");
console.log("- Expected: All 9 parts on 1 sheet in 3×3 grid");

try {
  console.log("\n🚀 Running optimization...");
  const results = calculateOptimalCuts(testStock, testParts, kerfThickness);
  
  if (!results.success) {
    console.error("❌ Optimization failed:", results.message);
    process.exit(1);
  }
  
  console.log("✨ Optimization completed!");
  
  // Analyze results
  const sheetsUsed = results.totalUsedSheets || results.stockUsage?.length || 0;
  const totalPlaced = results.stockUsage?.reduce((sum, sheet) => sum + sheet.placements.length, 0) || 0;
  const efficiency = results.materialEfficiency ? (results.materialEfficiency * 100) : 0;
  
  console.log(`\n📊 Results:`);
  console.log(`- Sheets used: ${sheetsUsed}`);
  console.log(`- Parts placed: ${totalPlaced}/9`);
  console.log(`- Efficiency: ${efficiency.toFixed(1)}%`);
  
  // Check if fix worked
  if (sheetsUsed === 1 && totalPlaced === 9) {
    console.log("\n✅ EFFICIENCY FIX SUCCESS!");
    console.log("🎉 All 9 parts placed on 1 sheet");
    
    // Show the layout
    if (results.stockUsage && results.stockUsage[0]) {
      const placements = results.stockUsage[0].placements;
      console.log("\n📍 Layout:");
      placements.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name}: (${p.x}, ${p.y})`);
      });
      
      // Verify it's a proper 3x3 grid
      const expectedPositions = [
        [0, 0], [802.4, 0], [1604.8, 0],
        [0, 402.4], [802.4, 402.4], [1604.8, 402.4],
        [0, 804.8], [802.4, 804.8], [1604.8, 804.8]
      ];
      
      let isProperGrid = true;
      for (let i = 0; i < Math.min(9, placements.length); i++) {
        const expected = expectedPositions[i];
        const actual = placements[i];
        if (Math.abs(actual.x - expected[0]) > 1 || Math.abs(actual.y - expected[1]) > 1) {
          console.log(`  ⚠️  Position ${i+1} mismatch: expected (${expected[0]}, ${expected[1]}), got (${actual.x}, ${actual.y})`);
          isProperGrid = false;
        }
      }
      
      if (isProperGrid) {
        console.log("✅ Perfect 3×3 grid layout achieved!");
      } else {
        console.log("⚠️  Layout is not optimal grid pattern");
      }
    }
    
  } else {
    console.error("\n❌ EFFICIENCY FIX FAILED");
    console.error(`Expected: 1 sheet, 9 parts`);
    console.error(`Got: ${sheetsUsed} sheets, ${totalPlaced} parts`);
    
    if (results.stockUsage) {
      console.log("\n📋 Sheet breakdown:");
      results.stockUsage.forEach((sheet, i) => {
        console.log(`  Sheet ${i+1}: ${sheet.placements.length} parts`);
      });
    }
  }
  
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
