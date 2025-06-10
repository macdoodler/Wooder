import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Simple Grain Debug', () => {
  it('should place basic part with grain direction', () => {
    const stocks: Stock[] = [{
      id: 'stock1',
      material: 'Plywood',
      thickness: 18,
      length: 1200,
      width: 800,
      cost: 50,
      description: 'Standard plywood',
      materialType: MaterialType.Sheet,
      quantity: 1,
      grainDirection: 'horizontal'
    }];

    const parts: Part[] = [{
      partName: 'Test Part',
      material: 'Plywood',
      thickness: 18,
      length: 300,
      width: 200,
      quantity: 1,
      grainDirection: 'horizontal'
    }];

    console.log('🔍 Testing with:');
    console.log('Stock grain:', stocks[0].grainDirection);
    console.log('Part grain:', parts[0].grainDirection);

    const result = calculateOptimalCuts(stocks, parts, 3);
    
    console.log('Result success:', result.success);
    console.log('Result message:', result.message);
    console.log('Result stockUsage length:', result.stockUsage?.length);
    
    if (result.stockUsage && result.stockUsage.length > 0) {
      console.log('First placement rotated:', result.stockUsage[0].placements[0]?.rotated);
    }

    expect(result.success).toBe(true);
  });
});
