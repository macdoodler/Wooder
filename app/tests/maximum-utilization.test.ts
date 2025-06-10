// Test to find the maximum number of parts that can fit on a 1220x2440mm sheet
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Maximum Utilization Analysis', () => {
  it('should determine maximum parts that can fit on 1220x2440mm sheet', () => {
    const availableStocks: Stock[] = [
      {
        id: 'stock-1',
        length: 1220,
        width: 2440,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: 'length'
      }
    ];

    console.log('\n=== TESTING MAXIMUM PART UTILIZATION ===');
    
    // Test 1: Try with more 400x600mm parts to see maximum
    console.log('\nTest 1: Maximum 400x600mm parts only');
    for (let qty = 8; qty <= 12; qty++) {
      const requiredParts: Part[] = [
        { length: 400, width: 600, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: qty, name: 'Small Part' }
      ];

      const result = calculateOptimalCuts(availableStocks, requiredParts, 3);
      
      if (result.success && result.stockUsage && result.stockUsage.length === 1) {
        const efficiency = (result.stockUsage[0].usedArea / (1220 * 2440)) * 100;
        console.log(`  ${qty} parts: SUCCESS - ${efficiency.toFixed(1)}% efficiency`);
      } else {
        console.log(`  ${qty} parts: FAILED`);
        break;
      }
    }

    // Test 2: Try adding one more 400x600mm part to the original 7-part layout
    console.log('\nTest 2: Original layout + 1 additional 400x600mm part');
    const requiredParts: Part[] = [
      { length: 600, width: 900, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: 4, name: 'Large Part' },
      { length: 400, width: 600, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: 4, name: 'Small Part' } // Increased from 3 to 4
    ];

    const result = calculateOptimalCuts(availableStocks, requiredParts, 3);
    
    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.stockUsage) {
      console.log(`Sheets used: ${result.stockUsage.length}`);
      result.stockUsage.forEach((usage, index) => {
        const efficiency = (usage.usedArea / (1220 * 2440)) * 100;
        console.log(`  Sheet ${index + 1}: ${usage.placements.length} parts, ${efficiency.toFixed(1)}% efficiency`);
      });
    }

    // Test 3: Try with different part arrangements to find optimal layout
    console.log('\nTest 3: Testing various combinations');
    
    const testCases = [
      { large: 4, small: 5, desc: '4 large + 5 small' },
      { large: 3, small: 6, desc: '3 large + 6 small' },
      { large: 3, small: 7, desc: '3 large + 7 small' },
      { large: 2, small: 8, desc: '2 large + 8 small' },
    ];

    testCases.forEach(testCase => {
      const parts: Part[] = [
        { length: 600, width: 900, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: testCase.large, name: 'Large Part' },
        { length: 400, width: 600, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: testCase.small, name: 'Small Part' }
      ];

      const testResult = calculateOptimalCuts(availableStocks, parts, 3);
      
      if (testResult.success && testResult.stockUsage && testResult.stockUsage.length === 1) {
        const efficiency = (testResult.stockUsage[0].usedArea / (1220 * 2440)) * 100;
        console.log(`  ${testCase.desc}: SUCCESS - ${efficiency.toFixed(1)}% efficiency`);
      } else {
        console.log(`  ${testCase.desc}: FAILED or multiple sheets`);
      }
    });

    expect(result.success).toBe(true);
  });
});
