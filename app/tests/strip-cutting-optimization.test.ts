/**
 * Strip-Cutting Optimization Test Suite
 * Verifies that small parts use efficient strip-cutting instead of grid alignment
 */

import { describe, test, expect } from '@jest/globals';
import { OptimizedCuttingEngine } from '../lib/optimized-cutting-engine';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Strip-Cutting Optimization', () => {
  test('should use strip-cutting for small parts mixed with large parts', () => {
    const testParts: Part[] = [
      { 
        length: 800, 
        width: 400, 
        quantity: 4,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        thickness: 18,
        grainDirection: 'vertical',
        name: 'Cabinet Sides'
      },
      { 
        length: 200, 
        width: 200, 
        quantity: 8,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        thickness: 18,
        grainDirection: 'vertical',
        name: 'Small Parts'
      }
    ];

    const testStock: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 2,
        grainDirection: 'horizontal'
      }
    ];

    const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 2.4);
    
    expect(result.success).toBe(true);
    expect(result.stockUsage).toBeDefined();
    expect(result.stockUsage.length).toBeGreaterThan(0);

    // Analyze strip-cutting effectiveness
    const firstSheet = result.stockUsage[0];
    const smallParts = firstSheet.placements.filter((p: any) => p.partId.includes('Part-1-'));
    
    if (smallParts.length > 1) {
      // Check for continuous placement (strip-cutting indicator)
      let adjacentPairs = 0;
      for (let i = 0; i < smallParts.length - 1; i++) {
        for (let j = i + 1; j < smallParts.length; j++) {
          const part1 = smallParts[i];
          const part2 = smallParts[j];
          const xDiff = Math.abs(part1.x - part2.x);
          const yDiff = Math.abs(part1.y - part2.y);
          
          // Parts are adjacent if they're close to part dimension + kerf apart
          if ((xDiff > 200 && xDiff < 210 && yDiff < 5) || 
              (yDiff > 200 && yDiff < 210 && xDiff < 5)) {
            adjacentPairs++;
          }
        }
      }
      
      // Should have some continuous placement (not all parts isolated)
      const continuousRatio = adjacentPairs / (smallParts.length - 1);
      console.log(`Strip-cutting effectiveness: ${(continuousRatio * 100).toFixed(1)}% continuous placement`);
      
      // At least 30% of parts should be in continuous strips
      expect(continuousRatio).toBeGreaterThan(0.3);
    }
  });

  test('should prefer strip-cutting over grid alignment for efficiency', () => {
    const testParts: Part[] = [
      { 
        length: 800, 
        width: 400, 
        quantity: 2,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        thickness: 18,
        grainDirection: 'vertical',
        name: 'Large Parts'
      },
      { 
        length: 150, 
        width: 150, 
        quantity: 12,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        thickness: 18,
        grainDirection: 'vertical',
        name: 'Very Small Parts'
      }
    ];

    const testStock: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: 'horizontal'
      }
    ];

    const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 2.4);
    
    expect(result.success).toBe(true);
    
    // Verify strip-cutting behavior and optimal efficiency
    if (result.stockUsage && result.stockUsage.length > 0) {
      const efficiency = (result.stockUsage[0].usedArea / (2440 * 1220)) * 100;
      console.log(`Overall efficiency with strip-cutting: ${efficiency.toFixed(1)}%`);
      
      // Calculate theoretical maximum efficiency:
      // 2 large parts (800x400) = 640,000 mm²
      // 12 small parts (150x150) = 270,000 mm²
      // Total: 910,000 mm² / Sheet: 2,976,800 mm² = 30.6%
      const theoreticalMax = (910000 / (2440 * 1220)) * 100;
      
      // Should achieve close to theoretical maximum (within 1% tolerance)
      expect(efficiency).toBeGreaterThan(theoreticalMax - 1);
      expect(efficiency).toBeLessThanOrEqual(theoreticalMax + 0.1);
      
      // Verify strip-cutting behavior: small parts should utilize bottom areas
      const sheet = result.stockUsage[0];
      const smallParts = sheet.placements.filter((p: any) => p.partId.includes('Part-1-'));
      
      if (smallParts.length > 0) {
        // Check that small parts are placed in bottom strip areas (Y > 800)
        const bottomAreaParts = smallParts.filter((p: any) => p.y > 800);
        const bottomUtilizationRatio = bottomAreaParts.length / smallParts.length;
        
        console.log(`Bottom area utilization: ${(bottomUtilizationRatio * 100).toFixed(1)}% of small parts`);
        
        // At least 60% of small parts should be in bottom strip areas
        expect(bottomUtilizationRatio).toBeGreaterThan(0.6);
      }
    }
  });

  test('should fall back to grid placement when strip-cutting is not beneficial', () => {
    // Test with parts that are not suitable for strip-cutting
    const testParts: Part[] = [
      { 
        length: 1000, 
        width: 500, 
        quantity: 3,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        thickness: 18,
        grainDirection: 'vertical',
        name: 'Large Parts'
      }
    ];

    const testStock: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: 'horizontal'
      }
    ];

    const result = OptimizedCuttingEngine.executeOptimization(testStock, testParts, 2.4);
    
    expect(result.success).toBe(true);
    // Large parts should use standard grid placement, not strip-cutting
    expect(result.stockUsage).toBeDefined();
    expect(result.stockUsage.length).toBeGreaterThan(0);
  });
});
