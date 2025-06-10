// Test file to reproduce and fix boundary violation, collision detection, and quantity control issues
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Boundary Violation and Collision Detection Tests', () => {
  test('should not place parts outside sheet boundaries', () => {
    const stocks: Stock[] = [
      {
        length: 100,
        width: 50,
        thickness: 18,
        quantity: 1,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 60,
        width: 30,
        thickness: 18,
        quantity: 2,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 0);
    
    if (result.success) {
      // Check that no parts are placed outside boundaries
      result.stockUsage.forEach(usage => {
        const stock = stocks[usage.stockIndex];
        usage.placements.forEach(placement => {
          const part = parts[0]; // We only have one part type
          const partWidth = placement.rotated ? part.width : part.length;
          const partHeight = placement.rotated ? part.length : part.width;
          
          // Check boundaries
          expect(placement.x >= 0).toBe(true);
          expect(placement.y >= 0).toBe(true);
          expect(placement.x + partWidth).toBeLessThanOrEqual(stock.length);
          expect(placement.y + partHeight).toBeLessThanOrEqual(stock.width);
        });
      });
    }
  });

  test('should not place overlapping parts', () => {
    const stocks: Stock[] = [
      {
        length: 200,
        width: 200,
        thickness: 18,
        quantity: 1,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 50,
        width: 50,
        thickness: 18,
        quantity: 4,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3); // 3mm kerf
    
    if (result.success) {
      // Check for overlaps
      result.stockUsage.forEach(usage => {
        const placements = usage.placements;
        
        for (let i = 0; i < placements.length; i++) {
          for (let j = i + 1; j < placements.length; j++) {
            const part1 = placements[i];
            const part2 = placements[j];
            const partDef = parts[0]; // Same part type
            
            const part1Width = part1.rotated ? partDef.width : partDef.length;
            const part1Height = part1.rotated ? partDef.length : partDef.width;
            const part2Width = part2.rotated ? partDef.width : partDef.length;
            const part2Height = part2.rotated ? partDef.length : partDef.width;
            
            // Check for overlap (including kerf)
            const part1Right = part1.x + part1Width + 3; // Include kerf
            const part1Bottom = part1.y + part1Height + 3;
            const part2Right = part2.x + part2Width + 3;
            const part2Bottom = part2.y + part2Height + 3;
            
            const noOverlapX = part1Right <= part2.x || part2Right <= part1.x;
            const noOverlapY = part1Bottom <= part2.y || part2Bottom <= part1.y;
            
            expect(noOverlapX || noOverlapY).toBe(true);
          }
        }
      });
    }
  });

  test('should place exactly the requested quantity, not more', () => {
    const stocks: Stock[] = [
      {
        length: 1000,
        width: 1000,
        thickness: 18,
        quantity: 2,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 100,
        width: 100,
        thickness: 18,
        quantity: 5, // Request exactly 5 parts
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 0);
    
    if (result.success) {
      let totalPartsPlaced = 0;
      result.stockUsage.forEach(usage => {
        totalPartsPlaced += usage.placements.length;
      });
      
      // Should place exactly 5 parts, not 6 or more
      expect(totalPartsPlaced).toBe(5);
    }
  });

  test('should handle edge case with tight fit and kerf', () => {
    const stocks: Stock[] = [
      {
        length: 105, // Just enough for 2x 50mm parts + 5mm kerf
        width: 55,   // Just enough for 1x 50mm part + 5mm kerf
        thickness: 18,
        quantity: 1,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 50,
        width: 50,
        thickness: 18,
        quantity: 2,
        material: 'MDF',
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 5); // 5mm kerf
    
    if (result.success) {
      // Verify boundary compliance with kerf
      result.stockUsage.forEach(usage => {
        const stock = stocks[usage.stockIndex];
        usage.placements.forEach(placement => {
          const part = parts[0];
          const partWidth = placement.rotated ? part.width : part.length;
          const partHeight = placement.rotated ? part.length : part.width;
          
          // Check boundaries including kerf
          expect(placement.x + partWidth + 5).toBeLessThanOrEqual(stock.length);
          expect(placement.y + partHeight + 5).toBeLessThanOrEqual(stock.width);
        });
      });
      
      // Should place exactly 2 parts
      let totalPartsPlaced = 0;
      result.stockUsage.forEach(usage => {
        totalPartsPlaced += usage.placements.length;
      });
      expect(totalPartsPlaced).toBe(2);
    }
  });
});
