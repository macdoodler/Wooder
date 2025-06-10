import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Stock, Part } from '../lib/types';

describe('Complex Visual Rendering Bug Investigation', () => {
  it('should identify placement count vs visual render disconnect in complex scenario', () => {
    console.log('=== DEBUGGING COMPLEX VISUAL RENDERING BUG ===');
    
    // More complex test case: Multiple part types and sizes that might trigger the bug
    const availableStocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const requiredParts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 4,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 6,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      },
      {
        length: 800,
        width: 150,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Complex scenario: Multiple part types with different sizes');

    // Run the calculation
    const results = calculateOptimalCuts(availableStocks, requiredParts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      console.log('\n=== ALGORITHM RESULTS ===');
      console.log('Total sheets used:', results.totalUsedSheets);
      console.log('Stock usage entries:', results.stockUsage.length);
      
      let totalPlacementsCalculated = 0;
      let totalPartsRequired = requiredParts.reduce((sum, part) => sum + part.quantity, 0);
      
      results.stockUsage.forEach((usage, index) => {
        console.log(`\nSheet ${index + 1} (${usage.sheetId}):`);
        console.log(`  - Stock Index: ${usage.stockIndex}`);
        console.log(`  - Placements: ${usage.placements.length}`);
        console.log(`  - Used Area: ${usage.usedArea}mm²`);
        console.log(`  - Waste Area: ${usage.wasteArea}mm²`);
        
        // List each placement with more detail
        usage.placements.forEach((placement, pIndex) => {
          const partIndex = parseInt(placement.partId.split('-')[1]);
          const part = requiredParts[partIndex];
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;
          console.log(`    ${pIndex + 1}. ${placement.partId} at (${placement.x}, ${placement.y}) ${width}×${height}mm ${placement.rotated ? 'ROTATED' : 'NOT ROTATED'}`);
        });
        
        totalPlacementsCalculated += usage.placements.length;
      });
      
      console.log(`\n=== CALCULATED TOTALS ===`);
      console.log(`Total placements calculated: ${totalPlacementsCalculated}`);
      console.log(`Total parts required: ${totalPartsRequired}`);
      console.log(`Match: ${totalPlacementsCalculated === totalPartsRequired ? 'YES ✓' : 'NO ✗'}`);
      
      console.log(`\n=== VISUAL RENDERING SIMULATION ===`);
      console.log('Simulating what the visual component would render...');
      
      let visualRenderCount = 0;
      let clippedPlacements = 0;
      let overlappingPlacements = 0;
      
      results.stockUsage.forEach((usage, index) => {
        const stock = availableStocks[usage.stockIndex];
        console.log(`\nSheet ${index + 1} Visualization:`);
        console.log(`  Stock: ${stock.length} × ${stock.width} × ${stock.thickness}mm`);
        console.log(`  Visual rectangles that would be rendered: ${usage.placements.length}`);
        
        // Track placed rectangles to check for overlaps
        const placedRectangles: Array<{x: number, y: number, width: number, height: number, index: number}> = [];
        
        // Simulate the visual rendering logic from page.tsx
        const placementsToRender = usage.placements.filter((placement, pIndex) => {
          const partIndex = parseInt(placement.partId.split('-')[1]);
          const part = requiredParts[partIndex];
          const scaleX = 100 / stock.length;
          const scaleY = 100 / stock.width;
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;

          // Check if rectangle would be visible (not clipped out of bounds)
          const leftPercent = placement.x * scaleX;
          const topPercent = placement.y * scaleY;
          const widthPercent = width * scaleX;
          const heightPercent = height * scaleY;
          
          // Check bounds
          const isWithinBounds = placement.x >= 0 && 
                                placement.y >= 0 && 
                                placement.x + width <= stock.length && 
                                placement.y + height <= stock.width;
          
          const isVisibleInContainer = leftPercent >= 0 && 
                                      topPercent >= 0 && 
                                      leftPercent + widthPercent <= 100 && 
                                      topPercent + heightPercent <= 100;
          
          if (!isWithinBounds) {
            console.log(`    ⚠️  Placement ${pIndex + 1} is OUTSIDE STOCK BOUNDS! Position: (${placement.x}, ${placement.y}), Size: ${width}×${height}, Stock: ${stock.length}×${stock.width}`);
            clippedPlacements++;
          }
          
          if (!isVisibleInContainer) {
            console.log(`    ⚠️  Placement ${pIndex + 1} would be CLIPPED IN VISUAL! Position: (${placement.x}, ${placement.y}), Size: ${width}×${height}`);
            console.log(`        Percentages: left=${leftPercent.toFixed(1)}%, top=${topPercent.toFixed(1)}%, width=${widthPercent.toFixed(1)}%, height=${heightPercent.toFixed(1)}%`);
            clippedPlacements++;
          }
          
          // Check for overlaps with previously placed rectangles
          const currentRect = {x: placement.x, y: placement.y, width, height, index: pIndex};
          for (const existingRect of placedRectangles) {
            const overlap = !(currentRect.x + currentRect.width <= existingRect.x || 
                             existingRect.x + existingRect.width <= currentRect.x ||
                             currentRect.y + currentRect.height <= existingRect.y || 
                             existingRect.y + existingRect.height <= currentRect.y);
            
            if (overlap) {
              console.log(`    🔴 OVERLAP DETECTED! Placement ${pIndex + 1} overlaps with placement ${existingRect.index + 1}`);
              console.log(`        Current: (${currentRect.x}, ${currentRect.y}) ${currentRect.width}×${currentRect.height}`);
              console.log(`        Existing: (${existingRect.x}, ${existingRect.y}) ${existingRect.width}×${existingRect.height}`);
              overlappingPlacements++;
            }
          }
          
          placedRectangles.push(currentRect);
          
          return isWithinBounds && isVisibleInContainer;
        });
        
        visualRenderCount += placementsToRender.length;
        console.log(`  Would actually render: ${placementsToRender.length} rectangles`);
        
        if (placementsToRender.length < usage.placements.length) {
          console.log(`  ❌ VISUAL DISCONNECT: ${usage.placements.length - placementsToRender.length} placements would NOT be rendered!`);
        }
      });
      
      console.log(`\n=== VISUAL RENDERING TOTALS ===`);
      console.log(`Total calculated placements: ${totalPlacementsCalculated}`);
      console.log(`Total that would be visually rendered: ${visualRenderCount}`);
      console.log(`Clipped placements: ${clippedPlacements}`);
      console.log(`Overlapping placements: ${overlappingPlacements}`);
      console.log(`Visual disconnect: ${totalPlacementsCalculated !== visualRenderCount ? 'YES ✗' : 'NO ✓'}`);
      
      if (totalPlacementsCalculated !== visualRenderCount) {
        console.log(`🐛 FOUND THE BUG: ${totalPlacementsCalculated - visualRenderCount} placements would not be rendered!`);
        console.log(`   - ${clippedPlacements} placements are outside bounds or clipped`);
        console.log(`   - ${overlappingPlacements} placements have overlaps`);
      }
      
      // Verify all parts were placed
      expect(totalPlacementsCalculated).toBe(totalPartsRequired);
    }
  });
});
