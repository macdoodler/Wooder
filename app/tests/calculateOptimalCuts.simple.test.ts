// Simple test to verify the basic functionality
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('calculateOptimalCuts - Basic Tests', () => {
  beforeEach(() => {
    // Mock console methods to reduce noise during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'clear').mockImplementation();
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
    jest.spyOn(console, 'table').mockImplementation();
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return success true for valid sheet material inputs', () => {
    const stocks: Stock[] = [
      { 
        length: 100, 
        width: 50, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      },
    ];

    const parts: Part[] = [
      { 
        length: 20, 
        width: 10, 
        thickness: 18, 
        quantity: 2,
        materialType: MaterialType.Sheet
      },
    ];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.stockUsage).toBeDefined();
    expect(result.totalUsedSheets).toBeGreaterThanOrEqual(0);
  });

  test('should return success false when no stocks provided', () => {
    const stocks: Stock[] = [];
    const parts: Part[] = [
      { 
        length: 20, 
        width: 10, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      },
    ];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });

  test('should handle empty parts array', () => {
    const stocks: Stock[] = [
      { 
        length: 100, 
        width: 50, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      },
    ];
    const parts: Part[] = [];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result.success).toBe(true);
    expect(result.totalUsedSheets).toBe(0);
  });

  test('should handle dimensional lumber cutting', () => {
    const stocks: Stock[] = [
      { 
        length: 2400, 
        width: 50, 
        thickness: 25, 
        quantity: 1,
        materialType: MaterialType.Dimensional
      },
    ];

    const parts: Part[] = [
      { 
        length: 600, 
        width: 50, 
        thickness: 25, 
        quantity: 3,
        materialType: MaterialType.Dimensional
      },
    ];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result.success).toBe(true);
    expect(result.totalUsedSheets).toBe(1);
  });

  test('should calculate waste correctly for perfect fit', () => {
    const stocks: Stock[] = [
      { 
        length: 100, 
        width: 100, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      },
    ];

    const parts: Part[] = [
      { 
        length: 50, 
        width: 50, 
        thickness: 18, 
        quantity: 4, // 4 parts that perfectly fit 100x100
        materialType: MaterialType.Sheet
      },
    ];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result.success).toBe(true);
    expect(result.totalWaste).toBe(0);
  });

  test('should handle parts that do not fit', () => {
    const stocks: Stock[] = [
      { 
        length: 50, 
        width: 50, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      },
    ];

    const parts: Part[] = [
      { 
        length: 100, 
        width: 100, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      },
    ];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No suitable stock found');
  });

  test('should not place parts outside sheet boundaries and respect quantity limits', () => {
    const stocks: Stock[] = [
      { 
        length: 200, 
        width: 200, 
        thickness: 18, 
        quantity: 2,
        materialType: MaterialType.Sheet
      },
    ];

    const parts: Part[] = [
      { 
        length: 50, 
        width: 50, 
        thickness: 18, 
        quantity: 5, // Request exactly 5 parts
        materialType: MaterialType.Sheet
      },
    ];

    const result = calculateOptimalCuts(stocks, parts, 3); // 3mm kerf

    if (result.success) {
      let totalPartsPlaced = 0;
      
      result.stockUsage.forEach(usage => {
        const stock = stocks[usage.stockIndex];
        
        // Check that no parts are placed outside boundaries
        usage.placements.forEach(placement => {
          const part = parts[0]; // We only have one part type
          const partWidth = placement.rotated ? part.width : part.length;
          const partHeight = placement.rotated ? part.length : part.width;
          
          // Check boundaries (including kerf allowance)
          expect(placement.x >= 0).toBe(true);
          expect(placement.y >= 0).toBe(true);
          expect(placement.x + partWidth + 3).toBeLessThanOrEqual(stock.length); // +3 for kerf
          expect(placement.y + partHeight + 3).toBeLessThanOrEqual(stock.width); // +3 for kerf
          
          totalPartsPlaced++;
        });
        
        // Check for overlapping parts on the same sheet
        const placements = usage.placements;
        for (let i = 0; i < placements.length; i++) {
          for (let j = i + 1; j < placements.length; j++) {
            const part1 = placements[i];
            const part2 = placements[j];
            const partDef = parts[0];
            
            const part1Width = part1.rotated ? partDef.width : partDef.length;
            const part1Height = part1.rotated ? partDef.length : partDef.width;
            const part2Width = part2.rotated ? partDef.width : partDef.length;
            const part2Height = part2.rotated ? partDef.length : partDef.width;
            
            // Check for overlap (including kerf)
            const part1Right = part1.x + part1Width + 3;
            const part1Bottom = part1.y + part1Height + 3;
            const part2Right = part2.x + part2Width + 3;
            const part2Bottom = part2.y + part2Height + 3;
            
            const noOverlapX = part1Right <= part2.x || part2Right <= part1.x;
            const noOverlapY = part1Bottom <= part2.y || part2Bottom <= part1.y;
            
            expect(noOverlapX || noOverlapY).toBe(true);
          }
        }
      });
      
      // Should place exactly 5 parts, not more
      expect(totalPartsPlaced).toBe(5);
    }
  });
});
