import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType } from '../lib/types';

describe('Debug Quantity 6 Issue', () => {
  beforeEach(() => {
    // Mock window for testing environment
    (global as any).window = { DEBUG_CUTTING: true };
  });

  test('debug why 6x parts fail with detailed logging', () => {
    const stocks = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 3,
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical'
      }
    ];

    const parts = [
      {
        length: 800,
        width: 400,
        thickness: 18,
        quantity: 6, // This quantity should work but currently breaks
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical',
        name: 'Part 1'
      },
      {
        length: 200,
        width: 200,
        thickness: 18,
        quantity: 4,
        material: 'Sheet Material',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical',
        name: 'Part 2'
      }
    ];

    console.log('\n=== DETAILED DEBUG: Why 6x parts fail ===');
    
    // Manual calculation to verify the parts should fit
    const part1Area = 800 * 400; // 320,000 mm²
    const part2Area = 200 * 200; // 40,000 mm²
    const sheetArea = 2440 * 1220; // 2,976,800 mm²
    
    console.log('\nManual Area Calculations:');
    console.log(`Part 1 (800x400): ${part1Area} mm² each, 6x = ${part1Area * 6} mm²`);
    console.log(`Part 2 (200x200): ${part2Area} mm² each, 4x = ${part2Area * 4} mm²`);
    console.log(`Total parts area: ${(part1Area * 6) + (part2Area * 4)} mm²`);
    console.log(`Sheet area: ${sheetArea} mm²`);
    console.log(`Theoretical utilization: ${(((part1Area * 6) + (part2Area * 4)) / sheetArea * 100).toFixed(1)}%`);
    
    // Test if parts physically fit (basic geometry check)
    console.log('\nGeometric Fit Analysis:');
    console.log('Sheet dimensions: 2440mm x 1220mm');
    console.log('Part 1 (800x400): Can fit', Math.floor(2440/800), 'x', Math.floor(1220/400), '=', Math.floor(2440/800) * Math.floor(1220/400), 'instances');
    console.log('Part 1 rotated (400x800): Can fit', Math.floor(2440/400), 'x', Math.floor(1220/800), '=', Math.floor(2440/400) * Math.floor(1220/800), 'instances');
    
    const result = calculateOptimalCuts(stocks, parts, 2.4);
    
    console.log('\n=== ALGORITHM RESULTS ===');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    
    if (result.stockUsage && result.stockUsage.length > 0) {
      const totalPlaced = result.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      console.log(`Total parts placed: ${totalPlaced}/10`);
      
      result.stockUsage.forEach((usage, sheetIndex) => {
        console.log(`\nSheet ${sheetIndex + 1} (${usage.sheetId}):`);
        console.log(`  Placements: ${usage.placements.length}`);
        console.log(`  Used area: ${usage.usedArea} mm² (${(usage.usedArea/1000000).toFixed(3)}m²)`);
        console.log(`  Waste area: ${usage.wasteArea} mm² (${(usage.wasteArea/1000000).toFixed(3)}m²)`);
        console.log(`  Efficiency: ${((usage.usedArea / (usage.usedArea + usage.wasteArea)) * 100).toFixed(1)}%`);
        
        // List all placements with details
        usage.placements.forEach((placement, pIndex) => {
          console.log(`    ${pIndex + 1}. ${placement.partId} at (${placement.x}, ${placement.y})${placement.rotated ? ' [ROTATED]' : ''}`);
        });
      });
    }
    
    // The test is expected to fail currently - we're debugging why
    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('This test should place all 10 parts successfully.');
    console.log('Current behavior: Only places 6 parts, fails to place remaining 4');
    console.log('Investigation needed: Why does the algorithm stop placing parts when there should be room?');
  });
});
