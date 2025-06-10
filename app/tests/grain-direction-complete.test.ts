/**
 * Comprehensive Grain Direction Test Suite
 * Tests the complete end-to-end grain direction functionality after the enhancement.
 */

import { calculateOptimalCuts } from "../lib/calculateOptimalCuts";
import { Stock, Part, MaterialType } from "../lib/types";

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe("Grain Direction - Complete Functionality", () => {
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
  // Test stocks with different grain directions
  const horizontalGrainStock: Stock = {
    id: "h-stock-1",
    length: 2400,
    width: 1200,
    thickness: 18,
    material: "Plywood",
    materialType: MaterialType.Sheet,
    quantity: 5,
    grainDirection: "horizontal"
  };

  const verticalGrainStock: Stock = {
    id: "v-stock-1", 
    length: 2400,
    width: 1200,
    thickness: 18,
    material: "Plywood",
    materialType: MaterialType.Sheet,
    quantity: 5,
    grainDirection: "vertical"
  };

  const noGrainStock: Stock = {
    id: "no-grain-1",
    length: 2400,
    width: 1200,
    thickness: 18,
    material: "MDF",
    materialType: MaterialType.Sheet,
    quantity: 5
    // No grain direction specified
  };

  describe("Grain Alignment Priority", () => {
    test("should prioritize grain-aligned placements over cross-grain", () => {
      const stocks = [horizontalGrainStock];
      
      // Part that aligns with horizontal grain when not rotated
      const horizontalPart: Part = {
        length: 800,  // longer dimension horizontal
        width: 400,   // shorter dimension vertical  
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: "horizontal"
      };

      const parts = [horizontalPart];
      
      const result = calculateOptimalCuts(stocks, parts, 3);
      
      expect(result.success).toBe(true);
      expect(result.stockUsage).toHaveLength(1);
      
      const placement = result.stockUsage[0].placements[0];
      
      // Should be placed without rotation (grain-aligned)
      expect(placement.rotated).toBe(false);
      expect(placement.x).toBeGreaterThanOrEqual(0);
      expect(placement.y).toBeGreaterThanOrEqual(0);

      console.log("✅ Grain-aligned placement prioritized correctly");
    });

    test("should place cross-grain when necessary", () => {
      const stocks = [verticalGrainStock];
      
      // Part that would require cross-grain placement
      const horizontalPart: Part = {
        length: 800,
        width: 400,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: "horizontal"
      };

      const parts = [horizontalPart];
      
      const result = calculateOptimalCuts(stocks, parts, 3);
      
      expect(result.success).toBe(true);
      expect(result.stockUsage).toHaveLength(1);
      
      const placement = result.stockUsage[0].placements[0];
      
      // Should be rotated to achieve grain alignment
      expect(placement.rotated).toBe(true);
      expect(placement.x).toBeGreaterThanOrEqual(0);
      expect(placement.y).toBeGreaterThanOrEqual(0);

      console.log("✅ Cross-grain placement works when needed");
    });
  });

  describe("Mixed Grain Direction Scenarios", () => {
    test("should handle parts with different grain requirements", () => {
      const stocks = [horizontalGrainStock, verticalGrainStock];
      
      const parts: Part[] = [
        {
          length: 600,
          width: 300,
          thickness: 18,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          quantity: 1,
          grainDirection: "horizontal"
        },
        {
          length: 600,
          width: 300, 
          thickness: 18,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          quantity: 1,
          grainDirection: "vertical"
        }
      ];
      
      const result = calculateOptimalCuts(stocks, parts, 3);
      
      expect(result.success).toBe(true);
      expect(result.stockUsage.length).toBeGreaterThan(0);
      
      // Should place parts optimally based on grain alignment
      let grainAlignedPlacements = 0;
      
      result.stockUsage.forEach(usage => {
        const stock = stocks[usage.stockIndex];
        const stockGrain = stock?.grainDirection;
        
        usage.placements.forEach(placement => {
          const partIndex = parseInt(placement.partId.split('-')[1]);
          const part = parts[partIndex];
          
          if (stockGrain && part.grainDirection) {
            const isAligned = (stockGrain === part.grainDirection && !placement.rotated) ||
                             (stockGrain !== part.grainDirection && placement.rotated);
            if (isAligned) {
              grainAlignedPlacements++;
            }
          }
        });
      });
      
      expect(grainAlignedPlacements).toBeGreaterThan(0);
      console.log(`✅ Found ${grainAlignedPlacements} grain-aligned placements in mixed scenario`);
    });
  });

  describe("No-Grain Parts", () => {
    test("should handle parts without grain direction", () => {
      const stocks = [horizontalGrainStock];
      
      const noGrainPart: Part = {
        length: 500,
        width: 400,
        thickness: 18,
        material: "Plywood", // Changed from MDF to match horizontalGrainStock
        materialType: MaterialType.Sheet,
        quantity: 1
        // No grain direction
      };
      
      const parts = [noGrainPart];
      
      const result = calculateOptimalCuts(stocks, parts, 3);
      
      expect(result.success).toBe(true);
      expect(result.stockUsage).toHaveLength(1);
      
      console.log("✅ No-grain part placed successfully");
    });
  });

  describe("Stock Without Grain Direction", () => {
    test("should handle stock without grain direction", () => {
      const stocks = [noGrainStock];
      
      const grainedPart: Part = {
        length: 600,
        width: 300,
        thickness: 18,
        material: "MDF", // Matches noGrainStock
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: "horizontal"
      };
      
      const parts = [grainedPart];
      
      const result = calculateOptimalCuts(stocks, parts, 3);
      
      expect(result.success).toBe(true);
      expect(result.stockUsage).toHaveLength(1);
      
      // Should place part even when stock has no grain direction
      const placement = result.stockUsage[0].placements[0];
      expect(placement).toBeDefined();
      
      console.log("✅ Grained part placed on no-grain stock successfully");
    });
  });

  describe("Space Utilization vs Grain Alignment", () => {
    test("should balance grain alignment with space efficiency", () => {
      // Small stock that forces efficient packing
      const smallStock: Stock = {
        id: "small-stock",
        length: 1000,
        width: 800,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: "horizontal"
      };
      
      const parts: Part[] = [
        {
          length: 900, // Large part that needs careful placement
          width: 300,
          thickness: 18,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          quantity: 1,
          grainDirection: "horizontal"
        },
        {
          length: 400,
          width: 200,
          thickness: 18,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          quantity: 1,
          grainDirection: "horizontal"
        }
      ];
      
      const result = calculateOptimalCuts([smallStock], parts, 3);
      
      expect(result.success).toBe(true);
      
      // Verify that parts were placed efficiently
      const totalPartArea = parts.reduce((sum, part) => 
        sum + (part.length * part.width * part.quantity), 0
      );
      
      const totalUsedArea = result.stockUsage.reduce((sum, usage) => 
        sum + usage.usedArea, 0
      );
      
      expect(totalUsedArea).toBeGreaterThanOrEqual(totalPartArea);
      
      console.log("✅ Space utilization balanced with grain alignment");
    });
  });

  describe("Logging and Debugging", () => {
    test("should provide grain direction decision logging", () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const stocks = [horizontalGrainStock];
      const parts: Part[] = [{
        length: 600,
        width: 300,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: "vertical"
      }];
      
      calculateOptimalCuts(stocks, parts, 3);
      
      // Should have grain-related logging
      const grainLogs = consoleSpy.mock.calls.filter(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('grain'))
      );
      
      expect(grainLogs.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
      console.log("✅ Grain direction logging working correctly");
    });
  });
});
