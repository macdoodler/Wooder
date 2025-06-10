import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Test to reproduce the space utilization issue where only 2 pieces of 400mm x 600mm
// are placed on a 1220mm × 2440mm stock when there should be space for 3 pieces

describe('Space Utilization Efficiency', () => {
  test('should fit 3 pieces of 400x600mm on 1220x2440mm stock', () => {
    const availableStocks: Stock[] = [
      {
        id: 'stock-1',
        length: 1220,
        width: 2440,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: 'length'
      }
    ];

    // Test case mentioned in issue: 4 pieces of 600mm x 900mm + 3 pieces of 400mm x 600mm
    const requiredParts: Part[] = [
      // 4 pieces of 600mm x 900mm
      { length: 600, width: 900, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: 4, name: 'Large Part' },
      // 3 pieces of 400mm x 600mm  
      { length: 400, width: 600, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: 3, name: 'Small Part' }
    ];

    const kerfThickness = 3;
    
    const result = calculateOptimalCuts(availableStocks, requiredParts, kerfThickness);
    
    console.log('Test Results:');
    console.log(`Success: ${result.success}`);
    console.log(`Sheets used: ${result.stockUsage?.length || 0}`);
    
    if (result.stockUsage) {
      result.stockUsage.forEach((usage, index) => {
        const stock = availableStocks[usage.stockIndex];
        const efficiency = (usage.usedArea / (stock.length * stock.width)) * 100;
        console.log(`\nSheet ${index + 1}:`);
        console.log(`  Stock: ${stock.length}x${stock.width}mm`);
        console.log(`  Parts placed: ${usage.placements.length}`);
        console.log(`  Used area: ${usage.usedArea}mm²`);
        console.log(`  Efficiency: ${efficiency.toFixed(1)}%`);
        console.log(`  Placements:`);
        
        usage.placements.forEach((placement, pIndex) => {
          const partIndex = parseInt(placement.partId.split('-')[1]);
          const part = requiredParts[partIndex];
          const actualWidth = placement.rotated ? part.length : part.width;
          const actualHeight = placement.rotated ? part.width : part.length;
          console.log(`    ${pIndex + 1}. ${part.name} at (${placement.x},${placement.y}) ${actualWidth}x${actualHeight}mm ${placement.rotated ? '(rotated)' : ''}`);
        });
        
        console.log(`  Free spaces remaining: ${usage.freeSpaces.length}`);
        usage.freeSpaces.forEach((space, spaceIndex) => {
          if (space.width >= 400 && space.height >= 600) {
            console.log(`    Large space ${spaceIndex + 1}: (${space.x},${space.y}) ${space.width}x${space.height}mm - Could fit 400x600mm part!`);
          }
        });
      });
    }

    // Specific test for the small parts - should all fit on one sheet
    if (result.stockUsage && result.stockUsage.length > 0) {
      const smallPartPlacements = result.stockUsage[0].placements.filter(p => {
        const partIndex = parseInt(p.partId.split('-')[1]);
        return requiredParts[partIndex].name === 'Small Part';
      });
      
      console.log(`\nSmall parts analysis:`);
      console.log(`Small parts placed on first sheet: ${smallPartPlacements.length}`);
      
      // Check if there's space for the third small part
      const sheet1 = result.stockUsage[0];
      const stock = availableStocks[sheet1.stockIndex];
      
      // Check if any free space can accommodate a 400x600mm part (with kerf)
      const canFitAnotherSmallPart = sheet1.freeSpaces.some(space => 
        (space.width >= 400 + kerfThickness && space.height >= 600 + kerfThickness) ||
        (space.width >= 600 + kerfThickness && space.height >= 400 + kerfThickness)
      );
      
      console.log(`Can fit another 400x600mm part: ${canFitAnotherSmallPart}`);
      
      if (canFitAnotherSmallPart && smallPartPlacements.length < 3) {
        console.log('⚠️  SPACE UTILIZATION ISSUE DETECTED: Available space not being used optimally!');
      }
    }

    expect(result.success).toBe(true);
  });

  test('should efficiently place 3 pieces of 400x600mm on single 1220x2440mm sheet', () => {
    // Simplified test - just the small parts
    const availableStocks: Stock[] = [
      {
        id: 'stock-1',
        length: 1220,
        width: 2440,
        thickness: 18,
        material: 'plywood',
        materialType: MaterialType.Sheet,
        quantity: 1,
        grainDirection: 'length'
      }
    ];

    const requiredParts: Part[] = [
      { length: 400, width: 600, thickness: 18, material: 'plywood', materialType: MaterialType.Sheet, quantity: 3, name: 'Small Part' }
    ];

    const kerfThickness = 3;
    
    const result = calculateOptimalCuts(availableStocks, requiredParts, kerfThickness);
    
    console.log('\nSimplified Test Results:');
    if (result.stockUsage && result.stockUsage.length > 0) {
      const sheet = result.stockUsage[0];
      const stock = availableStocks[sheet.stockIndex];
      console.log(`Sheet: ${stock.length}x${stock.width}mm`);
      console.log(`Parts placed: ${sheet.placements.length}`);
      
      // Calculate theoretical maximum that should fit
      const partArea = 400 * 600;
      const totalPartArea = partArea * 3;
      const sheetArea = stock.length * stock.width;
      const utilization = (totalPartArea / sheetArea) * 100;
      
      console.log(`Theoretical utilization: ${utilization.toFixed(1)}%`);
      console.log(`Should easily fit 3 parts on one sheet`);
    }

    expect(result.success).toBe(true);
    expect(result.stockUsage?.length).toBe(1); // Should all fit on one sheet
    expect(result.stockUsage?.[0].placements.length).toBe(3); // All 3 parts should be placed
  });
});
