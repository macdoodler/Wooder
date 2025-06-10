import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

describe('Quantity Bug Investigation', () => {
  beforeEach(() => {
    // Mock window for testing environment
    (global as any).window = { DEBUG_CUTTING: true };
  });

  test('2 parts requested should result in exactly 2 parts placed', () => {
    const stocks = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 5,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const parts = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 2, // Request exactly 2 parts
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal',
        name: 'Test Part'
      }
    ];

    console.log('=== Debug Test: 2 Parts Requested ===');
    console.log('Stocks:', JSON.stringify(stocks, null, 2));
    console.log('Parts:', JSON.stringify(parts, null, 2));

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);

    if (result.success) {
      console.log('\n=== RESULTS ===');
      console.log('Total sheets used:', result.totalUsedSheets);
      console.log('Stock usage entries:', result.stockUsage.length);
      
      let totalPartsPlaced = 0;
      result.stockUsage.forEach((usage, index) => {
        console.log(`\nSheet ${index + 1} (${usage.sheetId}):`);
        console.log(`  - Stock Index: ${usage.stockIndex}`);
        console.log(`  - Placements: ${usage.placements.length}`);
        console.log(`  - Used Area: ${usage.usedArea}mm²`);
        console.log(`  - Waste Area: ${usage.wasteArea}mm²`);
        
        // List each placement
        usage.placements.forEach((placement, pIndex) => {
          console.log(`    ${pIndex + 1}. ${placement.partId} at (${placement.x}, ${placement.y}) ${placement.rotated ? 'ROTATED' : 'NOT ROTATED'}`);
          totalPartsPlaced++;
        });
      });
      
      console.log(`\n=== QUANTITY CHECK ===`);
      console.log(`Parts requested: ${parts[0].quantity}`);
      console.log(`Parts placed: ${totalPartsPlaced}`);
      console.log(`Result: ${totalPartsPlaced === parts[0].quantity ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (totalPartsPlaced !== parts[0].quantity) {
        console.log(`\n🚨 QUANTITY BUG CONFIRMED: Expected ${parts[0].quantity}, got ${totalPartsPlaced}`);
      }

      // Test expectation
      expect(totalPartsPlaced).toBe(parts[0].quantity);
    }
  });

  test('3 parts requested should result in exactly 3 parts placed', () => {
    const stocks = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 5,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const parts = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 3, // Request exactly 3 parts
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal',
        name: 'Test Part'
      }
    ];

    console.log('\n=== Debug Test: 3 Parts Requested ===');
    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);

    if (result.success) {
      let totalPartsPlaced = 0;
      result.stockUsage.forEach((usage) => {
        totalPartsPlaced += usage.placements.length;
      });
      
      console.log(`\n=== QUANTITY CHECK ===`);
      console.log(`Parts requested: ${parts[0].quantity}`);
      console.log(`Parts placed: ${totalPartsPlaced}`);
      console.log(`Result: ${totalPartsPlaced === parts[0].quantity ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      // Test expectation
      expect(totalPartsPlaced).toBe(parts[0].quantity);
    }
  });
});
