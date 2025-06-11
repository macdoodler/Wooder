// Test efficiency regression fix
// Run with: npx tsx efficiency-test.mjs

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts';

console.log("🔧 EFFICIENCY REGRESSION FIX TEST");
console.log("==================================");

// Test data matching the user's scenario
const testStock = [
  {
    name: "Sheet Material",
    length: 2440,
    width: 1220, 
    thickness: 18,
    material: "Plywood",
    quantity: 8,
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
    quantity: 28,
    grainDirection: "horizontal"
  },
  {
    name: "test",
    length: 200,
    width: 200,
    thickness: 18, 
    material: "Plywood",
    quantity: 10,
    grainDirection: "horizontal"
  }
];

const kerfThickness = 2.4;

console.log("📊 Test Configuration:");
console.log("- Stock: 8x 2440×1220×18mm sheets");
console.log("- Parts: 28x Cabinet Sides (800×400mm) + 10x test parts (200×200mm)");
console.log("- Kerf: 2.4mm");

// Calculate expected efficiency
const sheetArea = 2440 * 1220;
const totalPartsArea = (800 * 400 * 28) + (200 * 200 * 10);
const theoreticalEfficiency = (totalPartsArea / (sheetArea * 8)) * 100;

console.log(`\n📐 Theoretical Analysis:`);
console.log(`- Total sheet area: ${(sheetArea * 8).toLocaleString()}mm²`);
console.log(`- Total parts area: ${totalPartsArea.toLocaleString()}mm²`);
console.log(`- Theoretical max efficiency: ${theoreticalEfficiency.toFixed(1)}%`);

// Calculate optimal parts per sheet for 800x400 parts
const partsPerRow = Math.floor(2440 / (800 + kerfThickness));
const rowsPerSheet = Math.floor(1220 / (400 + kerfThickness));
const optimalPartsPerSheet = partsPerRow * rowsPerSheet;

console.log(`\n🎯 Expected Layout for 800×400 parts:`);
console.log(`- Parts per row: ${partsPerRow} (${partsPerRow * (800 + kerfThickness)} ≤ 2440)`);
console.log(`- Rows per sheet: ${rowsPerSheet} (${rowsPerSheet * (400 + kerfThickness)} ≤ 1220)`);
console.log(`- Optimal parts per sheet: ${optimalPartsPerSheet}`);

try {
  console.log("\n🚀 Running optimization...");
  const results = calculateOptimalCuts(testStock, testParts, kerfThickness);
  
  if (!results.success) {
    console.error("❌ Optimization failed:", results.message);
    process.exit(1);
  }
  
  console.log("✨ Optimization completed!");
  
  // Analyze efficiency
  const sheetsUsed = results.totalUsedSheets || results.stockUsage?.length || 0;
  const totalPlaced = results.stockUsage?.reduce((sum, sheet) => sum + sheet.placements.length, 0) || 0;
  const actualEfficiency = results.materialEfficiency ? results.materialEfficiency * 100 : 0;
  
  console.log(`\n📊 Results Analysis:`);
  console.log(`- Sheets used: ${sheetsUsed}/8`);
  console.log(`- Parts placed: ${totalPlaced}/38 total parts`);
  console.log(`- Actual efficiency: ${actualEfficiency.toFixed(1)}%`);
  
  if (results.stockUsage) {
    console.log(`\n📋 Per-Sheet Breakdown:`);
    results.stockUsage.forEach((sheet, index) => {
      console.log(`  Sheet ${index + 1}: ${sheet.placements.length} parts`);
      
      // Analyze first few sheets for pattern
      if (index < 3) {
        const cabinetSides = sheet.placements.filter(p => p.name === "Cabinet Sides");
        const testParts = sheet.placements.filter(p => p.name === "test");
        console.log(`    - Cabinet Sides: ${cabinetSides.length}`);
        console.log(`    - Test parts: ${testParts.length}`);
        
        // Check if we're achieving optimal packing for cabinet sides
        if (cabinetSides.length < optimalPartsPerSheet && cabinetSides.length > 0) {
          console.log(`    ⚠️  Sub-optimal: Expected ${optimalPartsPerSheet} cabinet sides per sheet, got ${cabinetSides.length}`);
        }
      }
    });
  }
  
  // Check for efficiency regression
  const expectedMinEfficiency = 40; // Should be at least 40% for this layout
  if (actualEfficiency < expectedMinEfficiency) {
    console.error(`\n❌ EFFICIENCY REGRESSION DETECTED`);
    console.error(`Expected ≥${expectedMinEfficiency}%, got ${actualEfficiency.toFixed(1)}%`);
    console.error(`The collision fix may have caused placement efficiency issues.`);
  } else {
    console.log(`\n✅ EFFICIENCY MAINTAINED`);
    console.log(`Achieved ${actualEfficiency.toFixed(1)}% efficiency (≥${expectedMinEfficiency}% target)`);
  }
  
  // Check parts per sheet for first sheet
  if (results.stockUsage && results.stockUsage.length > 0) {
    const firstSheet = results.stockUsage[0];
    const cabinetSidesOnFirstSheet = firstSheet.placements.filter(p => p.name === "Cabinet Sides").length;
    
    if (cabinetSidesOnFirstSheet < optimalPartsPerSheet) {
      console.error(`\n🚨 LAYOUT INEFFICIENCY CONFIRMED`);
      console.error(`First sheet has ${cabinetSidesOnFirstSheet} cabinet sides, should have ${optimalPartsPerSheet}`);
      console.error(`This indicates the placement algorithm is not utilizing space efficiently.`);
    } else {
      console.log(`\n✅ LAYOUT EFFICIENCY VERIFIED`);
      console.log(`First sheet correctly placed ${cabinetSidesOnFirstSheet} cabinet sides`);
    }
  }
  
} catch (error) {
  console.error("❌ Test failed:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}
