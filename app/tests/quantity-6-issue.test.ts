import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

describe('Quantity 6 Issue Reproduction', () => {
  beforeEach(() => {
    // Mock window for testing environment
    (global as any).window = { DEBUG_CUTTING: true };
  });

  test('should handle 6x 800x400mm parts without breaking', () => {
    const stocks = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 3,
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      }
    ];

    const parts = [
      {
        length: 800,
        width: 400,
        thickness: 18,
        quantity: 6, // This quantity should work but currently breaks
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical',
        name: 'Part 1'
      },
      {
        length: 200,
        width: 200,
        thickness: 18,
        quantity: 4,
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical',
        name: 'Part 2'
      }
    ];

    console.log('\n=== QUANTITY 6 ISSUE REPRODUCTION TEST ===');
    console.log('Testing: 6x 800x400mm parts + 4x 200x200mm parts');
    console.log('Expected: Should fit on available stock but currently may break');

    // Calculate expected totals
    const totalPartsRequested = parts.reduce((sum, part) => sum + part.quantity, 0);
    const totalPartsArea = parts.reduce((sum, part) => sum + (part.length * part.width * part.quantity), 0);
    const totalStockArea = stocks.reduce((sum, stock) => sum + (stock.length * stock.width * stock.quantity), 0);

    console.log(`\nArea Analysis:`);
    console.log(`Total parts area needed: ${(totalPartsArea / 1000000).toFixed(3)}m²`);
    console.log(`Total stock area available: ${(totalStockArea / 1000000).toFixed(3)}m²`);
    console.log(`Theoretical utilization: ${((totalPartsArea / totalStockArea) * 100).toFixed(1)}%`);

    const result = calculateOptimalCuts(stocks, parts, 2.4);

    console.log(`\nResults:`);
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);

    if (result.success) {
      const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      console.log(`Parts placed: ${totalPartsPlaced}/${totalPartsRequested}`);
      console.log(`Sheets used: ${result.stockUsage.length}`);

      // Check if all parts were placed
      expect(totalPartsPlaced).toBe(totalPartsRequested);
      expect(result.success).toBe(true);

      // Log detailed placement info
      result.stockUsage.forEach((usage, index) => {
        console.log(`\nSheet ${index + 1}:`);
        console.log(`  Parts: ${usage.placements.length}`);
        console.log(`  Used area: ${(usage.usedArea / 1000000).toFixed(3)}m²`);
        console.log(`  Efficiency: ${((usage.usedArea / (usage.usedArea + usage.wasteArea)) * 100).toFixed(1)}%`);
      });
    } else {
      console.log(`❌ Test failed: ${result.message}`);
      // If it fails, we want to see why
      if (result.stockUsage && result.stockUsage.length > 0) {
        const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
        console.log(`Partial placement: ${totalPartsPlaced}/${totalPartsRequested} parts placed`);
      }
    }

    // The test should pass - if it fails, it indicates the bug we need to fix
    expect(result.success).toBe(true);
  });

  test('should handle 5x 800x400mm parts successfully (baseline)', () => {
    const stocks = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 3,
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      }
    ];

    const parts = [
      {
        length: 800,
        width: 400,
        thickness: 18,
        quantity: 5, // This quantity works (baseline from user report)
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical',
        name: 'Part 1'
      },
      {
        length: 200,
        width: 200,
        thickness: 18,
        quantity: 4,
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical',
        name: 'Part 2'
      }
    ];

    console.log('\n=== BASELINE TEST: 5x parts (should work) ===');
    
    const result = calculateOptimalCuts(stocks, parts, 2.4);
    const totalPartsRequested = parts.reduce((sum, part) => sum + part.quantity, 0);
    
    console.log(`Results: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (result.success) {
      const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      console.log(`Parts placed: ${totalPartsPlaced}/${totalPartsRequested}`);
      expect(totalPartsPlaced).toBe(totalPartsRequested);
    }

    expect(result.success).toBe(true);
  });
});
