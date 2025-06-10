/**
 * Simple test for part naming functionality
 */

import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Part, Stock } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('Part Naming', () => {
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

  test('should assign names to parts', () => {
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
        name: 'Test Part'
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      expect(results.stockUsage).toHaveLength(1);
      expect(results.stockUsage[0].placements).toHaveLength(1);
      expect(results.stockUsage[0].placements[0].name).toBe('Test Part');
    }
  });

  test('should use default names when no name provided', () => {
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
        materialType: MaterialType.Sheet
        // No name provided
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      expect(results.stockUsage).toHaveLength(1);
      expect(results.stockUsage[0].placements).toHaveLength(1);
      expect(results.stockUsage[0].placements[0].name).toBe('Part-0');
    }
  });
});
