import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Stock, Part, formatDimensions } from '../lib/types';

describe('Visual Rendering Bug Investigation', () => {
  test('should identify placement count vs visual render disconnect', () => {
    console.log('=== DEBUGGING VISUAL RENDERING BUG ===');
    
    // Test case: Simple scenario that should show multiple parts
    const availableStocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const requiredParts: Part[] = [
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 8,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Test scenario: 8 parts of 400x300mm on 2400x1200mm sheets');

    // Run the calculation
    const results = calculateOptimalCuts(availableStocks, requiredParts, 3);

    expect(results.success).toBe(true);
    
    if (results.success) {
      console.log('\n=== ALGORITHM RESULTS ===');
      console.log('Total sheets used:', results.totalUsedSheets);
      console.log('Stock usage entries:', results.stockUsage.length);
      
      let totalPlacementsCalculated = 0;
      results.stockUsage.forEach((usage, index) => {
        console.log(`\nSheet ${index + 1} (${usage.sheetId}):`);
        console.log(`  - Stock Index: ${usage.stockIndex}`);
        console.log(`  - Placements: ${usage.placements.length}`);
        console.log(`  - Used Area: ${usage.usedArea}mm²`);
        console.log(`  - Waste Area: ${usage.wasteArea}mm²`);
        
        // List each placement
        usage.placements.forEach((placement, pIndex) => {
          console.log(`    ${pIndex + 1}. ${placement.partId} at (${placement.x}, ${placement.y}) ${placement.rotated ? 'ROTATED' : 'NOT ROTATED'}`);
        });
        
        totalPlacementsCalculated += usage.placements.length;
      });
      
      console.log(`\n=== CALCULATED TOTALS ===`);
      console.log(`Total placements calculated: ${totalPlacementsCalculated}`);
      console.log(`Required parts: ${requiredParts[0].quantity}`);
      console.log(`Match: ${totalPlacementsCalculated === requiredParts[0].quantity ? 'YES ✓' : 'NO ✗'}`);
      
      // Verify all parts were placed
      expect(totalPlacementsCalculated).toBe(requiredParts[0].quantity);
      
      console.log(`\n=== VISUAL RENDERING SIMULATION ===`);
      console.log('Simulating what the visual component would render...');
      
      let visualRenderCount = 0;
      results.stockUsage.forEach((usage, index) => {
        const stock = availableStocks[usage.stockIndex];
        console.log(`\nSheet ${index + 1} Visualization:`);
        console.log(`  Stock: ${formatDimensions(stock)}`);
        console.log(`  Visual rectangles that would be rendered: ${usage.placements.length}`);
        
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
          
          const isVisible = leftPercent >= 0 && 
                           topPercent >= 0 && 
                           leftPercent + widthPercent <= 100 && 
                           topPercent + heightPercent <= 100;
          
          if (!isVisible) {
            console.log(`    ⚠️  Placement ${pIndex + 1} would be CLIPPED! Position: (${placement.x}, ${placement.y}), Size: ${width}×${height}`);
            console.log(`        Percentages: left=${leftPercent.toFixed(1)}%, top=${topPercent.toFixed(1)}%, width=${widthPercent.toFixed(1)}%, height=${heightPercent.toFixed(1)}%`);
          }
          
          return isVisible;
        });
        
        visualRenderCount += placementsToRender.length;
        console.log(`  Would actually render: ${placementsToRender.length} rectangles`);
      });
      
      console.log(`\n=== VISUAL RENDERING TOTALS ===`);
      console.log(`Total calculated placements: ${totalPlacementsCalculated}`);
      console.log(`Total that would be visually rendered: ${visualRenderCount}`);
      console.log(`Visual disconnect: ${totalPlacementsCalculated !== visualRenderCount ? 'YES ✗' : 'NO ✓'}`);
      
      if (totalPlacementsCalculated !== visualRenderCount) {
        console.log(`FOUND THE BUG: ${totalPlacementsCalculated - visualRenderCount} placements would not be rendered!`);
      }
    }
  });
});
