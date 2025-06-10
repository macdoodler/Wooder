// Test the inventory-based cutting optimization functionality
// This test validates the core issue: using minimum sheets from available inventory

import { calculateOptimalCuts } from './app/lib/calculateOptimalCuts.js';
import { MaterialType } from './app/lib/types.js';

// Test Case 1: Original Problem - 7 parts should fit on 1 sheet
console.log('\n=== INVENTORY OPTIMIZATION TEST ===');
console.log('Testing: 8 available sheets, 7 required parts');
console.log('Expected: Use 1 sheet optimally, 7 sheets remain unused\n');

const availableStocks = [
  {
    length: 2440,
    width: 1220,
    thickness: 18,
    quantity: 8,
    material: "MDF",
    materialType: MaterialType.Sheet
  }
];

const requiredParts = [
  // 4 cabinet sides (800x400mm each)
  {
    length: 800,
    width: 400,
    thickness: 18,
    quantity: 4,
    material: "MDF",
    materialType: MaterialType.Sheet
  },
  // 3 test pieces (200x200mm each)
  {
    length: 200,
    width: 200,
    thickness: 18,
    quantity: 3,
    material: "MDF", 
    materialType: MaterialType.Sheet
  }
];

const kerfThickness = 3;

console.log('Available Inventory:');
console.table(availableStocks);

console.log('\nRequired Parts:');
console.table(requiredParts);

console.log('\nCalculating optimal cuts...\n');

try {
  const result = calculateOptimalCuts(availableStocks, requiredParts, kerfThickness);
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.message}`);
  console.log(`Total Sheets Used: ${result.totalUsedSheets}`);
  
  if (result.success && result.stockUsage) {
    console.log('\nSheet Usage Details:');
    result.stockUsage.forEach((usage, index) => {
      console.log(`Sheet ${index + 1} (${usage.sheetId}): ${usage.placements.length} parts placed`);
      usage.placements.forEach(placement => {
        console.log(`  - ${placement.partId} at (${placement.x}, ${placement.y}), rotated: ${placement.rotated}`);
      });
    });
    
    // Verify test expectations
    console.log('\n=== TEST VALIDATION ===');
    const expectedSheetsUsed = 1;
    const actualSheetsUsed = result.totalUsedSheets;
    const expectedRemainingSheets = 7;
    const actualRemainingSheets = 8 - actualSheetsUsed;
    
    console.log(`Expected sheets used: ${expectedSheetsUsed}`);
    console.log(`Actual sheets used: ${actualSheetsUsed}`);
    console.log(`Expected remaining sheets: ${expectedRemainingSheets}`);
    console.log(`Actual remaining sheets: ${actualRemainingSheets}`);
    
    if (actualSheetsUsed <= expectedSheetsUsed) {
      console.log('✅ TEST PASSED: Used minimum number of sheets');
    } else {
      console.log('❌ TEST FAILED: Used more sheets than optimal');
    }
    
    // Check if all parts were placed
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = requiredParts.reduce((sum, part) => sum + part.quantity, 0);
    
    console.log(`Total parts required: ${totalPartsRequired}`);
    console.log(`Total parts placed: ${totalPartsPlaced}`);
    
    if (totalPartsPlaced === totalPartsRequired) {
      console.log('✅ All required parts were placed');
    } else {
      console.log('❌ Not all parts were placed');
    }
    
  } else {
    console.log('❌ Calculation failed:', result.message);
  }
  
} catch (error) {
  console.error('Test failed with error:', error.message);
  console.error(error.stack);
}

// Test Case 2: Insufficient Inventory
console.log('\n\n=== INSUFFICIENT INVENTORY TEST ===');
console.log('Testing: 1 small sheet, many large parts');
console.log('Expected: Error message about insufficient inventory\n');

const insufficientStock = [
  {
    length: 500,
    width: 500,
    thickness: 18,
    quantity: 1,
    material: "MDF",
    materialType: MaterialType.Sheet
  }
];

const tooManyParts = [
  {
    length: 800,
    width: 400,
    thickness: 18,
    quantity: 10, // Way too many for the available stock
    material: "MDF",
    materialType: MaterialType.Sheet
  }
];

try {
  const result2 = calculateOptimalCuts(insufficientStock, tooManyParts, kerfThickness);
  
  console.log('\n=== INSUFFICIENT INVENTORY TEST RESULTS ===');
  console.log(`Success: ${result2.success}`);
  console.log(`Message: ${result2.message}`);
  
  if (!result2.success && result2.message.includes('insufficient') || result2.message.includes('Insufficient')) {
    console.log('✅ INSUFFICIENT INVENTORY TEST PASSED: Correctly detected insufficient stock');
  } else {
    console.log('❌ INSUFFICIENT INVENTORY TEST FAILED: Should have detected insufficient stock');
  }
  
} catch (error) {
  console.error('Insufficient inventory test failed with error:', error.message);
}

console.log('\n=== INVENTORY OPTIMIZATION TESTS COMPLETED ===');
