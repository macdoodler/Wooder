/**
 * Comprehensive test for part naming functionality
 */

import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Part, Stock } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('Part Naming - Comprehensive', () => {
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

  test('should handle multiple parts with custom and default names', () => {
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      }
    ];

    const parts: Part[] = [
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 2,
        materialType: MaterialType.Sheet,
        name: 'Cabinet Door'
      },
      {
        length: 600,
        width: 200,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        name: 'Shelf Panel'
      },
      {
        length: 300,
        width: 150,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet
        // No name - should use default
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      // Count total placements
      const totalPlacements = results.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      expect(totalPlacements).toBe(4); // 2 Cabinet Doors + 1 Shelf Panel + 1 unnamed = 4

      // Check that all placements have names
      results.stockUsage.forEach(usage => {
        usage.placements.forEach(placement => {
          expect(placement.name).toBeDefined();
          expect(placement.name).not.toBe('');
          
          // Should be either a custom name or default format
          expect(
            placement.name === 'Cabinet Door' ||
            placement.name === 'Shelf Panel' ||
            placement.name?.startsWith('Part-')
          ).toBe(true);
        });
      });
    }
  });

  test('should handle dimensional lumber with custom names', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 100,
        thickness: 50,
        quantity: 1,
        materialType: MaterialType.Dimensional,
        grainDirection: 'Unspecified'
      }
    ];

    const parts: Part[] = [
      {
        length: 800,
        width: 100,
        thickness: 50,
        quantity: 2,
        materialType: MaterialType.Dimensional,
        name: 'Table Leg'
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      const totalPlacements = results.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      expect(totalPlacements).toBe(2); // 2 Table Legs

      results.stockUsage.forEach(usage => {
        usage.placements.forEach(placement => {
          expect(placement.name).toBe('Table Leg');
        });
      });
    }
  });

  test('should handle empty names gracefully', () => {
    const stocks: Stock[] = [
      {
        length: 1200,
        width: 600,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      }
    ];

    const parts: Part[] = [
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        name: '' // Empty string
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      expect(results.stockUsage[0].placements[0].name).toBe('Part-0');
    }
  });
});
