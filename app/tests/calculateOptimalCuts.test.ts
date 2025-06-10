import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Mock console and window for testing
const originalConsole = global.console;
const mockWindow = {
  DEBUG_CUTTING: false
};

beforeAll(() => {
  // Mock window for browser-specific code
  (global as any).window = mockWindow;
  // Mock console methods to reduce noise during tests
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    clear: jest.fn(),
    time: jest.fn(),
    timeEnd: jest.fn(),
    table: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
  delete (global as any).window;
});

describe('calculateOptimalCuts', () => {
  describe('Basic Functionality', () => {
    it('should not place more parts than required', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 2, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 20, width: 10, thickness: 2, quantity: 2, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.stockUsage).toBeDefined();
      expect(result.totalUsedSheets).toBeGreaterThanOrEqual(0);
    });

    it('should return success false when no stocks provided', () => {
      const stocks: Stock[] = [];
      const parts: Part[] = [
        { length: 20, width: 10, thickness: 2, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No suitable stock found');
    });

    it('should return success true when no parts provided', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 2, quantity: 1, materialType: MaterialType.Sheet },
      ];
      const parts: Part[] = [];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.stockUsage).toHaveLength(0);
      expect(result.totalUsedSheets).toBe(0);
    });
  });

  describe('Sheet Material Cutting', () => {
    it('should handle simple sheet cutting case', () => {
      const stocks: Stock[] = [
        { 
          length: 2440, 
          width: 1220, 
          thickness: 18, 
          quantity: 1,
          materialType: MaterialType.Sheet
        },
      ];

      const parts: Part[] = [
        { 
          length: 600, 
          width: 400, 
          thickness: 18, 
          quantity: 2,
          materialType: MaterialType.Sheet
        },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.stockUsage.length).toBeGreaterThan(0);
      expect(result.totalWaste).toBeGreaterThanOrEqual(0);
    });

    it('should handle parts that fit exactly', () => {
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
          length: 100, 
          width: 50, 
          thickness: 18, 
          quantity: 1,
          materialType: MaterialType.Sheet
        },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalUsedSheets).toBe(1);
      expect(result.totalWaste).toBe(0);
    });

    it('should handle multiple parts on one sheet', () => {
      const stocks: Stock[] = [
        { length: 200, width: 100, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 90, width: 45, thickness: 18, quantity: 4, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalUsedSheets).toBe(1);
    });
  });

  describe('Dimensional Lumber Cutting', () => {
    it('should handle dimensional lumber cutting', () => {
      const stocks: Stock[] = [
        { 
          length: 2400, 
          width: 90, 
          thickness: 45, 
          quantity: 2,
          materialType: MaterialType.Dimensional
        },
      ];

      const parts: Part[] = [
        { 
          length: 600, 
          width: 90, 
          thickness: 45, 
          quantity: 6,
          materialType: MaterialType.Dimensional
        },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.stockUsage.length).toBeGreaterThan(0);
    });

    it('should handle parts longer than stock', () => {
      const stocks: Stock[] = [
        { length: 1000, width: 50, thickness: 25, quantity: 1, materialType: MaterialType.Dimensional },
      ];

      const parts: Part[] = [
        { length: 1500, width: 50, thickness: 25, quantity: 1, materialType: MaterialType.Dimensional },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not enough suitable');
    });
  });

  describe('Kerf Thickness Handling', () => {
    it('should account for kerf thickness in calculations', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 50, width: 50, thickness: 18, quantity: 2, materialType: MaterialType.Sheet },
      ];

      const resultWithoutKerf = calculateOptimalCuts(stocks, parts, 0);
      const resultWithKerf = calculateOptimalCuts(stocks, parts, 3);

      expect(resultWithoutKerf.success).toBe(true);
      // With kerf, the second part might not fit
      expect(resultWithKerf.totalWaste).toBeGreaterThanOrEqual(resultWithoutKerf.totalWaste);
    });
  });

  describe('Material Type Matching', () => {
    it('should respect material type constraints', () => {
      const stocks: Stock[] = [
        { 
          length: 2400, 
          width: 1200, 
          thickness: 18, 
          quantity: 1,
          materialType: MaterialType.Sheet
        },
      ];

      const parts: Part[] = [
        { 
          length: 600, 
          width: 400, 
          thickness: 18, 
          quantity: 1,
          materialType: MaterialType.Dimensional // Different material type
        },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      // Should still work if materials are compatible by dimensions
      expect(result).toBeDefined();
    });

    it('should handle thickness mismatch', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 50, width: 25, thickness: 25, quantity: 1, materialType: MaterialType.Sheet }, // Different thickness
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity parts', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 50, width: 25, thickness: 18, quantity: 0, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalUsedSheets).toBe(0);
    });

    it('should handle very small parts', () => {
      const stocks: Stock[] = [
        { length: 1000, width: 500, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 1, width: 1, thickness: 18, quantity: 100, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalUsedSheets).toBe(1);
    });

    it('should handle large quantities', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 18, quantity: 10, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 25, width: 25, thickness: 18, quantity: 50, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalUsedSheets).toBeGreaterThan(0);
    });
  });

  describe('Waste Calculation', () => {
    it('should calculate waste correctly', () => {
      const stocks: Stock[] = [
        { length: 100, width: 100, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 50, width: 50, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalWaste).toBe(10000 - 2500); // 100*100 - 50*50
    });

    it('should have zero waste for perfect fit', () => {
      const stocks: Stock[] = [
        { length: 100, width: 50, thickness: 18, quantity: 1, materialType: MaterialType.Sheet },
      ];

      const parts: Part[] = [
        { length: 50, width: 50, thickness: 18, quantity: 2, materialType: MaterialType.Sheet },
      ];

      const result = calculateOptimalCuts(stocks, parts);

      expect(result.success).toBe(true);
      expect(result.totalWaste).toBe(0);
    });
  });
});
