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
        quantity: 3 // Three sheets available
      }
    ];

    // Many small pieces that might initially spread across sheets inefficiently
    const parts: Part[] = [
      {
        length: 200,
        width: 200,
        thickness: 12,
        quantity: 8, // 8 small squares
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      },
      {
        length: 300,
        width: 150,
        thickness: 12,
        quantity: 6, // 6 rectangles
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      },
      {
        length: 100,
        width: 100,
        thickness: 12,
        quantity: 12, // 12 tiny squares
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 2);

    expect(result.success).toBe(true);
    
    // Verify all parts placed
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.reduce((sum, part) => sum + part.quantity, 0);
    expect(totalPartsPlaced).toBe(totalPartsRequired);

    // Check that optimization consolidated pieces effectively
    console.log(`Sheets used: ${result.stockUsage.length}`);
    result.stockUsage.forEach((usage, index) => {
      const stock = stocks[0]; // All from same stock type
      const efficiency = (usage.usedArea / (stock.length * stock.width)) * 100;
      console.log(`Sheet ${index + 1}: ${usage.placements.length} pieces, ${efficiency.toFixed(1)}% efficiency`);
    });

    // Should use fewer sheets than naive placement
    expect(result.stockUsage.length).toBeLessThanOrEqual(2);
  });

  // Test scenario 3: Mixed material types (should not cross-optimize)
  test('Cross-sheet optimization respects material constraints', () => {
    console.log('\n=== TEST: Cross-sheet optimization respects material constraints ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 1
      },
      {
        id: '2',
        material: 'MDF',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'none',
        quantity: 1
      }
    ];

    const parts: Part[] = [
      // Plywood parts
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 1,
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
      },
      // MDF parts
      {
        length: 500,
        width: 350,
        thickness: 18,
        quantity: 1,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      },
      {
        length: 250,
        width: 180,
        thickness: 18,
        quantity: 2,
        material: 'MDF',
        materialType: MaterialType.Sheet,
        grainDirection: 'none'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    
    // Verify material constraints are respected
    result.stockUsage.forEach(usage => {
      const stock = stocks[usage.stockIndex]; // Use stockIndex to find the correct stock
      const stockMaterial = stock.material;
      
      usage.placements.forEach(placement => {
        const partIndex = parseInt(placement.partId.split('-')[1]);
        const part = parts[partIndex];
        
        expect(part.material).toBe(stockMaterial);
      });
    });

    console.log('Material constraint validation passed ✓');
  });

  // Test scenario 4: Grain direction constraints in cross-sheet optimization
  test('Cross-sheet optimization maintains grain direction alignment', () => {
    console.log('\n=== TEST: Cross-sheet optimization maintains grain direction alignment ===');
    
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
      // Parts with horizontal grain (should align with stock)
      {
        length: 800,
        width: 400,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      {
        length: 600,
        width: 300,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      // Parts with vertical grain (should be rotated)
      {
        length: 400,
        width: 700, // This should be rotated to fit
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      },
      // Small parts for waste regions
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
    
    // Verify grain alignment for each placement
    result.stockUsage.forEach(usage => {
      const stock = stocks[0]; // Same stock type
      
      usage.placements.forEach(placement => {
        const partIndex = parseInt(placement.partId.split('-')[1]);
        const part = parts[partIndex];
        
        if (part.grainDirection && stock.grainDirection) {
          const isAligned = (part.grainDirection === stock.grainDirection && !placement.rotated) ||
                           (part.grainDirection !== stock.grainDirection && placement.rotated);
          
          expect(isAligned).toBe(true);
          console.log(`Part ${partIndex}: grain ${part.grainDirection}, rotated: ${placement.rotated} ✓`);
        }
      });
    });

    console.log('Grain direction constraint validation passed ✓');
  });

  // Test scenario 5: Large-scale optimization with many sheets and parts
  test('Large-scale multi-sheet optimization performance', () => {
    console.log('\n=== TEST: Large-scale multi-sheet optimization performance ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1220,
        width: 2440,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 5 // 5 sheets available
      }
    ];

    // Generate many parts of varying sizes
    const parts: Part[] = [];
    
    // Large parts
    for (let i = 0; i < 3; i++) {
      parts.push({
        length: 1000 + (i * 50),
        width: 600 + (i * 30),
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      });
    }
    
    // Medium parts
    for (let i = 0; i < 8; i++) {
      parts.push({
        length: 400 + (i * 25),
        width: 300 + (i * 20),
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      });
    }
    
    // Small parts
    for (let i = 0; i < 15; i++) {
      parts.push({
        length: 150 + (i * 10),
        width: 100 + (i * 8),
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      });
    }

    const startTime = performance.now();
    const result = calculateOptimalCuts(stocks, parts, 3);
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.success).toBe(true);
    
    // Performance check - should complete within reasonable time
    expect(duration).toBeLessThan(10000); // 10 seconds max
    console.log(`Optimization completed in ${duration.toFixed(2)}ms`);
    
    // Verify all parts were placed
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    const totalPartsRequired = parts.length;
    expect(totalPartsPlaced).toBe(totalPartsRequired);

    // Calculate overall efficiency
    let totalEfficiency = 0;
    result.stockUsage.forEach((usage, index) => {
      const stock = stocks[0];
      const efficiency = (usage.usedArea / (stock.length * stock.width)) * 100;
      totalEfficiency += efficiency;
      console.log(`Sheet ${index + 1}: ${usage.placements.length} pieces, ${efficiency.toFixed(1)}% efficiency`);
    });
    
    const averageEfficiency = totalEfficiency / result.stockUsage.length;
    console.log(`Average efficiency: ${averageEfficiency.toFixed(1)}%`);
    console.log(`Total sheets used: ${result.stockUsage.length}/${stocks[0].quantity}`);
    
    // Should achieve reasonable efficiency with cross-sheet optimization
    expect(averageEfficiency).toBeGreaterThan(50);
  });

  // Test scenario 6: Verification that single sheet scenarios skip optimization
  test('Single sheet scenarios skip cross-sheet optimization', () => {
    console.log('\n=== TEST: Single sheet scenarios skip cross-sheet optimization ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 1200,
        width: 800,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 1
      }
    ];

    const parts: Part[] = [
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage.length).toBe(1); // Only one sheet used
    
    // Should still complete successfully without optimization
    const totalPartsPlaced = result.stockUsage[0].placements.length;
    expect(totalPartsPlaced).toBe(2);
    
    console.log('Single sheet scenario handled correctly ✓');
  });

  // Test scenario 7: Edge case with no valid optimizations
  test('Handles scenarios with no valid cross-sheet optimizations', () => {
    console.log('\n=== TEST: Handles scenarios with no valid cross-sheet optimizations ===');
    
    const stocks: Stock[] = [
      {
        id: '1',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 600,
        width: 400,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 1
      },
      {
        id: '2',
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        length: 600,
        width: 400,
        thickness: 18,
        grainDirection: 'horizontal',
        quantity: 1
      }
    ];

    // Parts that perfectly fit their respective sheets with no optimization potential
    const parts: Part[] = [
      {
        length: 580,
        width: 380,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      {
        length: 580,
        width: 380,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage.length).toBe(2);
    
    // Verify that both parts were placed even without optimization opportunities
    const totalPartsPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
    expect(totalPartsPlaced).toBe(2);
    
    console.log('No optimization scenario handled correctly ✓');
  });
});
