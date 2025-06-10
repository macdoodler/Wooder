import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Grain Direction Debug - Material Type Issue', () => {
  it('should work with materialType specified', () => {
    const stocks: Stock[] = [{
      id: "test-stock",
      length: 2400,
      width: 1200,
      thickness: 18,
      material: "Plywood",
      quantity: 1,
      grainDirection: "horizontal",
      materialType: MaterialType.Sheet  // Add this
    }];

    const parts: Part[] = [{
      length: 800,
      width: 400,
      thickness: 18,
      material: "Plywood",
      quantity: 1,
      grainDirection: "horizontal",
      materialType: MaterialType.Sheet  // Add this
    }];

    console.log('🔍 Testing with materialType specified:');
    console.log('Stock materialType:', stocks[0].materialType);
    console.log('Part materialType:', parts[0].materialType);

    const result = calculateOptimalCuts(stocks, parts, 3);
    
    console.log('Result success:', result.success);
    console.log('Result message:', result.message);
    
    if (result.stockUsage && result.stockUsage.length > 0) {
      console.log('First placement rotated:', result.stockUsage[0].placements[0]?.rotated);
    }

    expect(result.success).toBe(true);
  });

  it('should fail without materialType', () => {
    const stocks: Stock[] = [{
      id: "test-stock",
      length: 2400,
      width: 1200,
      thickness: 18,
      material: "Plywood",
      quantity: 1,
      grainDirection: "horizontal"
      // No materialType
    }];

    const parts: Part[] = [{
      length: 800,
      width: 400,
      thickness: 18,
      material: "Plywood",
      quantity: 1,
      grainDirection: "horizontal"
      // No materialType
    }];

    console.log('🔍 Testing without materialType:');

    const result = calculateOptimalCuts(stocks, parts, 3);
    
    console.log('Result success:', result.success);
    console.log('Result message:', result.message);

    // This should fail since no materialType is specified
    expect(result.success).toBe(false);
  });
});
