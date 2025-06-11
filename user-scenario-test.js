// Exact user scenario test
// Copy and paste this into the browser console at http://localhost:3000

console.log("🔧 TESTING USER'S EXACT SCENARIO");
console.log("================================");

// Exact data from the user's scenario
const userStock = [{
  name: "Sheet Material",
  length: 2440,
  width: 1220,
  thickness: 18,
  material: "Plywood",
  quantity: 8,
  grainDirection: "horizontal",
  materialType: "Sheet Material"
}];

const userParts = [
  {
    name: "Cabinet Sides",
    length: 800,
    width: 400,
    thickness: 18,
    material: "Plywood",
    quantity: 28,
    grainDirection: "horizontal",
    materialType: "Sheet Material"
  },
  {
    name: "test",
    length: 200,
    width: 200,
    thickness: 18,
    material: "Plywood",
    quantity: 10,
    grainDirection: "horizontal",
    materialType: "Sheet Material"
  }
];

const kerfThickness = 2.4;

console.log("📊 User's Configuration:");
console.log("- Stock: 8 sheets of 2440×1220×18mm");
console.log("- Parts: 28×Cabinet Sides (800×400mm) + 10×test parts (200×200mm)");
console.log("- Kerf: 2.4mm");

// Expected analysis
console.log("\n📐 Expected Efficiency Analysis:");
console.log("Cabinet Sides (800×400mm):");
console.log("- Parts per row: 3 (3×802.4 = 2407.2mm ≤ 2440mm)");
console.log("- Rows per sheet: 3 (3×402.4 = 1207.2mm ≤ 1220mm)");
console.log("- Parts per sheet: 9");
console.log("- Sheets needed for 28 parts: 4 sheets (4×9 = 36 ≥ 28)");

console.log("\nTest parts (200×200mm):");
console.log("- Parts per row: 12 (12×202.4 = 2428.8mm ≤ 2440mm)");
console.log("- Rows per sheet: 6 (6×202.4 = 1214.4mm ≤ 1220mm)");
console.log("- Parts per sheet: 72");
console.log("- All 10 test parts should fit on remaining space of cabinet sheets");

console.log("\n🎯 EXPECTED OPTIMAL RESULT:");
console.log("- Total sheets used: 4 (not 7!)");
console.log("- Efficiency: ~70%+ (not 44.9%)");

// Manual test instructions
console.log("\n📝 MANUAL TEST STEPS:");
console.log("1. Clear all current data");
console.log("2. Add stock: Length=2440, Width=1220, Thickness=18, Quantity=8");
console.log("3. Add part 1: Name='Cabinet Sides', Length=800, Width=400, Thickness=18, Quantity=28");
console.log("4. Add part 2: Name='test', Length=200, Width=200, Thickness=18, Quantity=10");
console.log("5. Set kerf thickness: 2.4");
console.log("6. Click 'Calculate Optimal Cuts'");

console.log("\n🔍 WHAT TO CHECK:");
console.log("- Number of sheets used (should be ≤4, not 7)");
console.log("- Parts per sheet for Cabinet Sides (should be ≥6, not 4)");
console.log("- Overall efficiency (should be ≥60%, not 44.9%)");

console.log("\n⚠️  REGRESSION INDICATORS:");
console.log("- If still seeing 4 Cabinet Sides per sheet: Free space management issue");
console.log("- If still using 7 sheets: Space utilization regression");
console.log("- If efficiency <50%: Placement algorithm inefficiency");

// Store data for easy setup
window.userTestData = { userStock, userParts, kerfThickness };
console.log("\n💾 User's test data stored in window.userTestData");

// Quick validation function
window.validateResults = function(results) {
  if (!results || !results.stockUsage) {
    console.error("❌ No results to validate");
    return false;
  }
  
  const sheetsUsed = results.stockUsage.length;
  const efficiency = results.materialEfficiency ? (results.materialEfficiency * 100) : 0;
  
  console.log("\n📊 VALIDATION RESULTS:");
  console.log(`- Sheets used: ${sheetsUsed} (expected ≤4)`);
  console.log(`- Efficiency: ${efficiency.toFixed(1)}% (expected ≥60%)`);
  
  // Check first sheet cabinet sides count
  if (results.stockUsage.length > 0) {
    const firstSheet = results.stockUsage[0];
    const cabinetSides = firstSheet.placements.filter(p => p.name === "Cabinet Sides");
    console.log(`- Cabinet Sides on first sheet: ${cabinetSides.length} (expected ≥6)`);
    
    if (cabinetSides.length < 6) {
      console.error("❌ EFFICIENCY REGRESSION: Too few cabinet sides per sheet");
      return false;
    }
  }
  
  if (sheetsUsed > 4) {
    console.error("❌ EFFICIENCY REGRESSION: Using too many sheets");
    return false;
  }
  
  if (efficiency < 60) {
    console.error("❌ EFFICIENCY REGRESSION: Overall efficiency too low");
    return false;
  }
  
  console.log("✅ EFFICIENCY FIX SUCCESSFUL!");
  return true;
};

console.log("\n🚀 Ready to test! Run the calculation and call window.validateResults(results)");
