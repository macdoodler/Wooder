#!/usr/bin/env node

// Test the space utilization improvements
import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts.js';

console.log('🧪 Testing Space Utilization Improvements');
console.log('========================================');

// Test data that was showing poor utilization
const testStock = [
  {
    name: 'MDF 18mm',
    length: 2440,
    width: 1220,
    thickness: 18,
    quantity: 10,
    grainDirection: 'any'
  }
];

const testParts = [
  {
    name: 'bob',
    length: 800,
    width: 400,
    thickness: 18,
    quantity: 4,
    grainDirection: 'any'
  },
  {
    name: 'keith',
    length: 200,
    width: 200,
    thickness: 18,
    quantity: 24,
    grainDirection: 'any'
  }
];

const kerfThickness = 3.2;

// Expected optimal layout calculations
const sheetArea = 2440 * 1220; // 2,976,800 mm²
const bobArea = 800 * 400; // 320,000 mm² each
const keithArea = 200 * 200; // 40,000 mm² each
const totalPartsArea = (4 * bobArea) + (24 * keithArea); // 2,240,000 mm²
const expectedEfficiency = (totalPartsArea / sheetArea) * 100; // ~75.3%

console.log(`\n📏 Test Parameters:`);
console.log(`- Sheet: 2440×1220mm (${sheetArea.toLocaleString()}mm²)`);
console.log(`- Bob parts: 4 × 800×400mm (${(4 * bobArea).toLocaleString()}mm²)`);
console.log(`- Keith parts: 24 × 200×200mm (${(24 * keithArea).toLocaleString()}mm²)`);
console.log(`- Total parts area: ${totalPartsArea.toLocaleString()}mm²`);
console.log(`- Expected single-sheet efficiency: ${expectedEfficiency.toFixed(1)}%`);

// Calculate optimal placements per sheet for bob parts
const bobWithKerf = 800 + kerfThickness;
const bobPartsPerRow = Math.floor(2440 / bobWithKerf);
const bobRowsPerSheet = Math.floor(1220 / (400 + kerfThickness));
const optimalBobPerSheet = bobPartsPerRow * bobRowsPerSheet;

console.log(`\n🎯 Expected Bob Layout:`);
console.log(`- Bob parts per row: ${bobPartsPerRow}`);
console.log(`- Bob rows per sheet: ${bobRowsPerSheet}`);
console.log(`- Optimal bob parts per sheet: ${optimalBobPerSheet}`);

try {
  console.log("\n🚀 Running optimization with improvements...");
  const results = calculateOptimalCuts(testStock, testParts, kerfThickness);
  
  if (!results.success) {
    console.error("❌ Optimization failed:", results.message);
    process.exit(1);
  }
  
  console.log("✨ Optimization completed!");
  
  // Analyze results
  console.log(`\n📊 Results Analysis:`);
  console.log(`- Sheets used: ${results.totalUsedSheets}`);
  console.log(`- Success: ${results.success}`);
  
  // Analyze each sheet
  results.stockUsage.forEach((sheet, index) => {
    const efficiency = ((sheet.usedArea / (2440 * 1220)) * 100).toFixed(1);
    const waste = (((2440 * 1220) - sheet.usedArea) / (2440 * 1220) * 100).toFixed(1);
    
    // Count parts by type
    const bobParts = sheet.placements.filter(p => p.name === 'bob').length;
    const keithParts = sheet.placements.filter(p => p.name === 'keith').length;
    
    console.log(`\n  Sheet ${index + 1}:`);
    console.log(`    - Parts: ${sheet.placements.length} total (${bobParts} bob + ${keithParts} keith)`);
    console.log(`    - Used area: ${sheet.usedArea.toLocaleString()}mm²`);
    console.log(`    - Efficiency: ${efficiency}%`);
    console.log(`    - Waste: ${waste}%`);
  });
  
  // Calculate overall efficiency
  const totalUsedArea = results.stockUsage.reduce((sum, sheet) => sum + sheet.usedArea, 0);
  const totalSheetArea = results.stockUsage.length * (2440 * 1220);
  const overallEfficiency = (totalUsedArea / totalSheetArea * 100).toFixed(1);
  const overallWaste = (100 - overallEfficiency).toFixed(1);
  
  console.log(`\n🎯 Overall Performance:`);
  console.log(`- Overall efficiency: ${overallEfficiency}%`);
  console.log(`- Overall waste: ${overallWaste}%`);
  console.log(`- Expected single-sheet efficiency: ${expectedEfficiency.toFixed(1)}%`);
  
  // Success criteria
  const isImproved = parseFloat(overallEfficiency) > 70; // Should be much better than 40.3%
  const usesFewerSheets = results.totalUsedSheets <= 2; // Should ideally use 1-2 sheets max
  
  if (isImproved && usesFewerSheets) {
    console.log("\n✅ SUCCESS: Space utilization improvements are working!");
    console.log(`   - Efficiency improved to ${overallEfficiency}% (was ~40.3%)`);
    console.log(`   - Using ${results.totalUsedSheets} sheets (was 2 with poor utilization)`);
  } else {
    console.log("\n⚠️  NEEDS IMPROVEMENT:");
    if (!isImproved) console.log(`   - Efficiency still low: ${overallEfficiency}%`);
    if (!usesFewerSheets) console.log(`   - Still using too many sheets: ${results.totalUsedSheets}`);
  }
  
} catch (error) {
  console.error("💥 Test failed with error:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}
