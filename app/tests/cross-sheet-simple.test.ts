// Simple Cross-Sheet Optimization Test
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Cross-Sheet Optimization Tests', () => {
  test('Basic two-sheet optimization test', () => {
    const stocks: Stock[] = [
      {
        id: '1',
        name: 'Plywood Sheet',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        cost: 50,
        quantity: 2
      }
    ];

    const parts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage.length).toBeGreaterThan(0);
    
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    expect(totalPartsPlaced).toBe(totalPartsRequired);
  });
});
