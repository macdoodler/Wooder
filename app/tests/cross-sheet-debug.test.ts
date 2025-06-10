import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Cross-Sheet Debug Test', () => {
  test('should run a basic cross-sheet test', () => {
    const stocks: Stock[] = [{
      id: 'test-stock-1',
      material: 'Plywood',
      thickness: 18,
      length: 1200,
      width: 800,
      materialType: MaterialType.Sheet,
      quantity: 2,
      grainDirection: 'horizontal'
    }];

    const parts: Part[] = [{
      name: 'Test Part 1',
      material: 'Plywood',
      thickness: 18,
      length: 600,
      width: 400,
      quantity: 2,
      grainDirection: 'horizontal'
    }, {
      name: 'Test Part 2',
      material: 'Plywood',
      thickness: 18,
      length: 300,
      width: 200,
      quantity: 2,
      grainDirection: 'horizontal'
    }];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage.length).toBeGreaterThan(0);
    
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    expect(totalPartsPlaced).toBe(totalPartsRequired);
  });
});
