// Test the space utilization fix
// Run with: npx tsx space-utilization-test.mjs

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts.ts';

console.log("🔧 SPACE UTILIZATION FIX TEST");
console.log("==============================");

// Test data matching the user's scenario
const testStock = [
  {
    name: "Test Sheet",
    length: 2440,
    width: 1220, 
    thickness: 18,
    material: "Plywood",
    quantity: 2,
    grainDirection: "horizontal"
  }
];

const testParts = [
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
    quantity: 28,
    grainDirection: "horizontal"
  }
];

const kerfThickness = 2.4;

console.log("📊 Test Configuration:");
console.log("- Stock: 2x 2440×1220×18mm sheets");
console.log("- Parts: 4×bob (800×400mm) + 28×keith (200×200mm)");
console.log("- Kerf: 2.4mm");

// Calculate expected optimal layout
console.log("\n📐 Expected Optimal Layout:");
console.log("Sheet #1 should fit:");
console.log("- 4 bob parts (800×400mm)");
console.log("- Many keith parts (200×200mm) in remaining space");
console.log("- Target: Much more than 28 parts on sheet 1");

console.log("\nSheet #2 should fit:");
console.log("- Remaining keith parts only");
console.log("- Target: High utilization, not just 4 parts");

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
  console.log(`- Sheets used: ${sheetsUsed}/2`);
  console.log(`- Parts placed: ${totalPlaced}/32`);
  console.log(`- Efficiency: ${efficiency.toFixed(1)}%`);
  
  if (results.stockUsage) {
    console.log(`\n📋 Per-Sheet Analysis:`);
    results.stockUsage.forEach((sheet, index) => {
      const bobParts = sheet.placements.filter(p => p.name === "bob").length;
      const keithParts = sheet.placements.filter(p => p.name === "keith").length;
      const wastePercentage = ((sheet.wasteArea / (2440 * 1220)) * 100);
      
      console.log(`  Sheet ${index + 1}: ${sheet.placements.length} total parts`);
      console.log(`    - Bob parts: ${bobParts}`);
      console.log(`    - Keith parts: ${keithParts}`);
      console.log(`    - Waste: ${wastePercentage.toFixed(1)}%`);
      
      if (sheet.placements.length < 10 && index === 0) {
        console.log(`    ⚠️  Sheet 1 underutilized: Only ${sheet.placements.length} parts`);
      }
      
      if (sheet.placements.length < 10 && index === 1 && keithParts > 0) {
        console.log(`    ⚠️  Sheet 2 underutilized: Only ${sheet.placements.length} parts with ${wastePercentage.toFixed(1)}% waste`);
      }
    });
  }
  
  // Check for improvement
  const sheet1Parts = results.stockUsage?.[0]?.placements.length || 0;
  const sheet2Parts = results.stockUsage?.[1]?.placements.length || 0;
  
  console.log(`\n🎯 Fix Evaluation:`);
  if (sheet1Parts > 28) {
    console.log("✅ Sheet 1 utilization IMPROVED (>28 parts)");
  } else {
    console.error(`❌ Sheet 1 still underutilized: ${sheet1Parts} parts`);
  }
  
  if (sheet2Parts > 4) {
    console.log("✅ Sheet 2 utilization IMPROVED (>4 parts)");
  } else {
    console.error(`❌ Sheet 2 still underutilized: ${sheet2Parts} parts`);
  }
  
  if (efficiency > 60) {
    console.log("✅ Overall efficiency IMPROVED (>60%)");
  } else {
    console.error(`❌ Overall efficiency still low: ${efficiency.toFixed(1)}%`);
  }
  
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
