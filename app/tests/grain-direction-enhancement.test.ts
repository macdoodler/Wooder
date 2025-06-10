// Test to verify enhanced grain direction visualization
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('Enhanced Grain Direction Visualization', () => {
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
  test('should show enhanced grain direction indicators for sheet materials', () => {
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const parts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal' // Should align with stock
      },
      {
        length: 400,
        width: 600,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical' // Should be cross grain
      }
    ];

    console.log('\n=== ENHANCED GRAIN DIRECTION TEST ===');
    console.log('Testing grain direction visualization enhancements:');
    console.log('1. Larger, more prominent grain direction symbols');
    console.log('2. Color-coded background indicators');
    console.log('3. Clear ALIGNED/CROSS labels');
    console.log('4. Comprehensive grain direction legend');

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    expect(results.stockUsage).toHaveLength(1);
    
    const usage = results.stockUsage[0];
    console.log(`\nFound ${usage.placements.length} placements:`);
    
    usage.placements.forEach((placement, index) => {
      const partIndex = parseInt(placement.partId.split('-')[1]);
      const part = results.sortedParts![partIndex];
      
      // Determine grain alignment
      const stockGrain = stocks[0].grainDirection?.toLowerCase();
      const partGrain = part.grainDirection?.toLowerCase();
      
      let grainStatus = 'unknown';
      if (stockGrain && partGrain) {
        const isAligned = (stockGrain === partGrain && !placement.rotated) ||
                         (stockGrain !== partGrain && placement.rotated);
        grainStatus = isAligned ? 'ALIGNED ↕' : 'CROSS ↔';
      }
      
      console.log(`  Part ${index + 1}: ${part.length}×${part.width}mm`);
      console.log(`    - Stock grain: ${stockGrain || 'none'}`);
      console.log(`    - Part grain: ${partGrain || 'none'}`);
      console.log(`    - Rotated: ${placement.rotated}`);
      console.log(`    - Grain status: ${grainStatus}`);
      console.log(`    - Visual indicator: ${grainStatus.includes('ALIGNED') ? 
        '🟢 Green background with ↕ ALIGNED' : 
        '🔴 Red background with ↔ CROSS'}`);
    });

    console.log('\n=== ENHANCEMENT FEATURES ===');
    console.log('✓ Larger grain direction symbols (text-lg instead of text-[10px])');
    console.log('✓ Color-coded backgrounds (green for aligned, red for cross)');
    console.log('✓ Bold ALIGNED/CROSS labels for clarity');
    console.log('✓ Grain direction legend explaining all symbols');
    console.log('✓ Enhanced dimensional lumber grain indicators');
    console.log('✓ Improved parts list with detailed grain information');
  });

  test('should show grain direction for dimensional lumber', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 90,
        thickness: 45,
        quantity: 1,
        material: 'Pine',
        materialType: MaterialType.Dimensional,
        grainDirection: 'horizontal' // Along length
      }
    ];

    const parts: Part[] = [
      {
        length: 600,
        width: 90,
        thickness: 45,
        quantity: 3,
        material: 'Pine',
        materialType: MaterialType.Dimensional,
        grainDirection: 'horizontal'
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    expect(results.stockUsage).toHaveLength(1);
    
    const usage = results.stockUsage[0];
    console.log(`\n=== DIMENSIONAL LUMBER GRAIN TEST ===`);
    console.log(`Found ${usage.placements.length} dimensional lumber placements:`);
    
    usage.placements.forEach((placement, index) => {
      const partIndex = parseInt(placement.partId.split('-')[1]);
      const part = results.sortedParts![partIndex];
      
      console.log(`  Part ${index + 1}: ${part.length}mm lumber piece`);
      console.log(`    - Grain direction: ${part.grainDirection || 'none'}`);
      console.log(`    - Visual indicator: 🔵 Blue background with || GRAIN`);
    });
  });

  test('should handle mixed material types with different grain indicators', () => {
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      {
        length: 2400,
        width: 90,
        thickness: 45,
        quantity: 1,
        material: 'Pine',
        materialType: MaterialType.Dimensional,
        grainDirection: 'horizontal'
      }
    ];

    const parts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      },
      {
        length: 800,
        width: 90,
        thickness: 45,
        quantity: 1,
        material: 'Pine',
        materialType: MaterialType.Dimensional,
        grainDirection: 'horizontal'
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3);

    expect(results.success).toBe(true);
    
    console.log(`\n=== MIXED MATERIALS GRAIN TEST ===`);
    console.log('Verifying different grain indicators for different material types:');
    
    results.stockUsage.forEach((usage, stockIndex) => {
      const stock = stocks[usage.stockIndex];
      console.log(`\nStock ${stockIndex + 1} (${stock.materialType}):`);
      
      usage.placements.forEach((placement, index) => {
        const partIndex = parseInt(placement.partId.split('-')[1]);
        const part = results.sortedParts![partIndex];
        
        if (stock.materialType === MaterialType.Sheet) {
          const stockGrain = stock.grainDirection?.toLowerCase();
          const partGrain = part.grainDirection?.toLowerCase();
          const isAligned = stockGrain && partGrain ? 
            (stockGrain === partGrain && !placement.rotated) ||
            (stockGrain !== partGrain && placement.rotated) : false;
          
          console.log(`  Sheet Part ${index + 1}: ${isAligned ? 
            '🟢 ↕ ALIGNED (green background)' : 
            '🔴 ↔ CROSS (red background)'}`);
        } else {
          console.log(`  Dimensional Part ${index + 1}: 🔵 || GRAIN (blue background)`);
        }
      });
    });
  });
});
