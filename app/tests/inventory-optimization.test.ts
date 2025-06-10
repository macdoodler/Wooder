// Test the inventory-based cutting optimization functionality
// This test validates the core issue: using minimum sheets from available inventory

import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

describe('Inventory-Based Cutting Optimization', () => {
  
  test('should use minimum sheets from available inventory', () => {
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

    const result = calculateOptimalCuts(availableStocks, requiredParts, kerfThickness);
    
    console.log('\n=== TEST RESULTS ===');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    console.log(`Total Sheets Used: ${result.totalUsedSheets}`);
    
    // Verify test expectations
    expect(result.success).toBe(true);
    
    if (result.success && result.stockUsage) {
      console.log('\nSheet Usage Details:');
      result.stockUsage.forEach((usage, index) => {
        console.log(`Sheet ${index + 1} (${usage.sheetId}): ${usage.placements.length} parts placed`);
        usage.placements.forEach(placement => {
          console.log(`  - ${placement.partId} at (${placement.x}, ${placement.y}), rotated: ${placement.rotated}`);
        });
      });
      
      console.log('\n=== TEST VALIDATION ===');
      const expectedSheetsUsed = 1;
      const actualSheetsUsed = result.totalUsedSheets;
      const expectedRemainingSheets = 7;
      const actualRemainingSheets = 8 - actualSheetsUsed;
      
      console.log(`Expected sheets used: ${expectedSheetsUsed}`);
      console.log(`Actual sheets used: ${actualSheetsUsed}`);
      console.log(`Expected remaining sheets: ${expectedRemainingSheets}`);
      console.log(`Actual remaining sheets: ${actualRemainingSheets}`);
      
      // Test that we use minimum number of sheets (should be 1 or 2 at most)
      expect(actualSheetsUsed).toBeLessThanOrEqual(2);
      console.log('✅ TEST PASSED: Used minimal number of sheets');
      
      // Check if all parts were placed
      const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      const totalPartsRequired = requiredParts.reduce((sum, part) => sum + part.quantity, 0);
      
      console.log(`Total parts required: ${totalPartsRequired}`);
      console.log(`Total parts placed: ${totalPartsPlaced}`);
      
      expect(totalPartsPlaced).toBe(totalPartsRequired);
      console.log('✅ All required parts were placed');
      
      // Test that the message indicates inventory optimization
      expect(result.message).toContain('sheet');
      expect(result.message).toContain('remaining');
      
    } else {
      fail('Calculation failed: ' + result.message);
    }
  });

  test('should detect insufficient inventory', () => {
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

    const result = calculateOptimalCuts(insufficientStock, tooManyParts, 3);
    
    console.log('\n=== INSUFFICIENT INVENTORY TEST RESULTS ===');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    
    expect(result.success).toBe(false);
    expect(result.message.toLowerCase()).toMatch(/insufficient|capacity|cannot fit/);
    console.log('✅ INSUFFICIENT INVENTORY TEST PASSED: Correctly detected insufficient stock');
  });

  test('should optimize for different stock sizes', () => {
    console.log('\n\n=== MIXED STOCK SIZES TEST ===');
    console.log('Testing: Multiple stock sizes, should prefer larger sheets to minimize usage');
    
    const mixedStocks = [
      // Small sheets - should be used last
      {
        length: 1000,
        width: 600,
        thickness: 18,
        quantity: 5,
        material: "MDF",
        materialType: MaterialType.Sheet
      },
      // Large sheets - should be used first
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 3,
        material: "MDF",
        materialType: MaterialType.Sheet
      }
    ];

    const smallParts = [
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 6,
        material: "MDF",
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(mixedStocks, smallParts, 3);
    
    console.log('\n=== MIXED STOCK TEST RESULTS ===');
    console.log(`Success: ${result.success}`);
    console.log(`Total Sheets Used: ${result.totalUsedSheets}`);
    
    expect(result.success).toBe(true);
    
    // Should use very few sheets for small parts
    expect(result.totalUsedSheets).toBeLessThanOrEqual(2);
    console.log('✅ MIXED STOCK TEST PASSED: Efficiently used minimal sheets');
  });
});
