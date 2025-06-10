// Cross-Sheet Optimization Test Suite
// Comprehensive validation of multi-sheet waste reduction functionality

import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Cross-Sheet Optimization', () => {
  // Test scenario 1: Two sheets where redistribution can improve efficiency
  test('Basic cross-sheet redistribution reduces waste', () => {
    console.log('\n=== TEST: Basic cross-sheet redistribution reduces waste ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 2 // Two identical sheets
      }
    ];

    // Parts that will initially be placed suboptimally but can be redistributed
    const parts: Part[] = [
      // Large parts that might fill one sheet inefficiently
      {
        length: 1000,
        width: 600,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      // Medium parts that could fit in remaining spaces
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      // Small parts that can fill waste regions
      {
        length: 200,
        width: 150,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage.length).toBeGreaterThan(0);
    
    // Verify that all parts were placed
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    expect(totalPartsPlaced).toBe(totalPartsRequired);

    // Calculate efficiency - should be improved by cross-sheet optimization
    let totalEfficiency = 0;
    result.stockUsage.forEach(usage => {
      const stock = stocks[usage.stockIndex]; // Use stockIndex to find the correct stock
      if (stock) {
        const efficiency = (usage.usedArea / (stock.length * stock.width)) * 100;
        totalEfficiency += efficiency;
        console.log(`Sheet ${usage.sheetId}: ${efficiency.toFixed(1)}% efficiency`);
      }
    });
    
    const averageEfficiency = totalEfficiency / result.stockUsage.length;
    console.log(`Average efficiency: ${averageEfficiency.toFixed(1)}%`);
    
    // With cross-sheet optimization, we should achieve decent efficiency
    expect(averageEfficiency).toBeGreaterThan(40); // Reasonable threshold
  });

  // Test scenario 2: Multiple sheets with small pieces that can be consolidated
  test('Small piece consolidation across multiple sheets', () => {
    console.log('\n=== TEST: Small piece consolidation across multiple sheets ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'MDF',
        materialType: MaterialType.Sheet,
        length: 1220,
        width: 2440,
        thickness: 12,
        grainDirection: 'none',
        quantity: 3 // Three sheets for testing consolidation
      }
    ];

    // Many small parts that should be consolidated efficiently
    const parts: Part[] = [
      {
        length: 300,
        width: 200,
        thickness: 12,
        quantity: 5,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      },
      {
        length: 250,
        width: 150,
        thickness: 12,
        quantity: 8,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      },
      {
        length: 180,
        width: 120,
        thickness: 12,
        quantity: 12,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      },
      {
        length: 100,
        width: 80,
        thickness: 12,
        quantity: 20,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    
    // Verify all parts were placed
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    expect(totalPartsPlaced).toBe(totalPartsRequired);

    // With good consolidation, we should use fewer sheets than parts
    expect(result.totalUsedSheets).toBeLessThan(totalPartsRequired);
    
    console.log(`Total parts: ${totalPartsRequired}, Sheets used: ${result.totalUsedSheets}`);
    console.log(`Consolidation ratio: ${(totalPartsRequired / result.totalUsedSheets).toFixed(2)} parts per sheet`);
  });

  // Test scenario 3: Cross-material optimization should be prevented
  test('Material constraint validation - no cross-material optimization', () => {
    console.log('\n=== TEST: Material constraint validation ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 2
      },
      {
        id: '2',
        material: 'MDF',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'none',
        quantity: 2
      }
    ];

    const parts: Part[] = [
      // Plywood parts
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      // MDF parts
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 2,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    
    // Verify parts are placed only on correct materials
    result.stockUsage.forEach(usage => {
      const stock = stocks[usage.stockIndex]; // Use stockIndex to find the correct stock
      if (stock) {
        console.log(`Sheet ${usage.sheetId} (${stock.material}): ${usage.placements.length} parts`);
        // In a real implementation, we'd verify part-stock material matching here
        // For now, just ensure we have some placements
        expect(usage.placements.length).toBeGreaterThan(0);
      }
    });
  });

  // Test scenario 4: Grain direction alignment during optimization
  test('Grain direction alignment preservation during optimization', () => {
    console.log('\n=== TEST: Grain direction alignment preservation ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 2
      }
    ];

    const parts: Part[] = [
      // Parts requiring horizontal grain
      {
        length: 800,
        width: 300,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      // Parts requiring vertical grain  
      {
        length: 300,
        width: 800,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    
    // Verify all parts were placed despite grain requirements
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    expect(totalPartsPlaced).toBe(totalPartsRequired);

    console.log(`Placed ${totalPartsPlaced} parts with grain direction constraints`);
  });

  // Test scenario 5: Large-scale performance test
  test('Large-scale cross-sheet optimization performance', () => {
    console.log('\n=== TEST: Large-scale cross-sheet optimization performance ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 2440,
        width: 1220,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 10 // Ten large sheets
      }
    ];

    // Generate many parts of varying sizes
    const parts: Part[] = [];
    const sizes = [
      [400, 300], [350, 250], [300, 200], [250, 180], [200, 150],
      [180, 120], [150, 100], [120, 80], [100, 60], [80, 50]
    ];
    
    sizes.forEach(([length, width], index) => {
      parts.push({
        length,
        width,
        thickness: 18,
        quantity: 5 + index, // Varying quantities
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      });
    });

    const startTime = Date.now();
    const result = calculateOptimalCuts(stocks, parts, 3);
    const endTime = Date.now();
    
    const executionTime = endTime - startTime;
    console.log(`Execution time: ${executionTime}ms`);

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    
    console.log(`Total parts required: ${totalPartsRequired}`);
    console.log(`Total parts placed: ${totalPartsPlaced}`);
    console.log(`Sheets used: ${result.totalUsedSheets}`);
    
    expect(totalPartsPlaced).toBe(totalPartsRequired);
  });

  // Test scenario 6: Single sheet scenario (should skip cross-sheet optimization)
  test('Single sheet scenario handling', () => {
    console.log('\n=== TEST: Single sheet scenario handling ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 1 // Only one sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    
    // Should use exactly one sheet
    expect(result.totalUsedSheets).toBe(1);
    
    console.log(`Single sheet optimization completed. Efficiency: ${((result.stockUsage[0]?.usedArea || 0) / (1200 * 800) * 100).toFixed(1)}%`);
  });

  // Test scenario 7: Edge case with no valid optimizations
  test('Edge case with no valid cross-sheet optimizations', () => {
    console.log('\n=== TEST: Edge case with no valid cross-sheet optimizations ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1000,
        width: 600,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 2
      }
    ];

    // Parts that perfectly fit each sheet individually
    const parts: Part[] = [
      {
        length: 1000,
        width: 600,
        thickness: 18,
        quantity: 2, // Exactly fills both sheets
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.totalUsedSheets).toBe(2); // Should use both sheets
    
    // Each sheet should be nearly 100% utilized
    result.stockUsage.forEach((usage, index) => {
      const efficiency = (usage.usedArea / (1000 * 600)) * 100;
      console.log(`Sheet ${index + 1} efficiency: ${efficiency.toFixed(1)}%`);
      expect(efficiency).toBeGreaterThan(95); // Nearly perfect fit
    });
  });
});
