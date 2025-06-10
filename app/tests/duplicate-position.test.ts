import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('Critical Issues Test', () => {
  beforeEach(() => {
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

  it('should detect duplicate positions and capacity issues', () => {
    const stocks: Stock[] = [
      { 
        length: 2440, 
        width: 1220, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      { 
        length: 800, 
        width: 400, 
        thickness: 18, 
        quantity: 10, // This should be impossible to fit - 10 × 320,000 = 3,200,000 > 2,976,800
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    // Should fail capacity validation
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot fit');
  });

  it('should validate feasible placement without duplicates', () => {
    const stocks: Stock[] = [
      { 
        length: 1200, 
        width: 800, 
        thickness: 18, 
        quantity: 1,
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      { 
        length: 300, 
        width: 200, 
        thickness: 18, 
        quantity: 6, // Should fit: 6 × 60,000 = 360,000 < 960,000
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts);

    expect(result.success).toBe(true);
    
    // Check for duplicate positions across all sheets
    const allPositions = new Set<string>();
    let duplicateFound = false;
    
    result.stockUsage.forEach(usage => {
      usage.placements.forEach(placement => {
        const positionKey = `${usage.sheetId}:${placement.x},${placement.y}`;
        
        if (allPositions.has(positionKey)) {
          duplicateFound = true;
        }
        
        allPositions.add(positionKey);
      });
    });

    expect(duplicateFound).toBe(false);
    expect(result.totalWaste).toBeGreaterThanOrEqual(0);
  });
});
