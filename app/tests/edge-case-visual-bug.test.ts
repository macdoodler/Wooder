import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Stock, Part } from '../lib/types';

describe('Edge Case Visual Rendering Bug Investigation', () => {
  test('should investigate part indexing and rendering with invalid partId parsing', () => {
    console.log('=== DEBUGGING EDGE CASE VISUAL RENDERING BUG ===');
    
    // Edge case: Parts with quantities that might cause indexing issues
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

    // Edge case: Let's test with parts where partIndex might be invalid
    const requiredParts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      },
      {
        length: 500,
        width: 300,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Edge case scenario: Multiple part types with varying quantities');
    console.log('This might reveal issues with partId parsing in visual rendering');

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
        
        // Detailed analysis of each placement's partId
        usage.placements.forEach((placement, pIndex) => {
          const partIndex = parseInt(placement.partId.split('-')[1]);
          console.log(`    ${pIndex + 1}. ${placement.partId} -> partIndex: ${partIndex}`);
          
          // Check if partIndex is valid
          if (isNaN(partIndex) || partIndex < 0 || partIndex >= requiredParts.length) {
            console.log(`      🔴 INVALID PART INDEX! ${partIndex} is not in range [0, ${requiredParts.length - 1}]`);
            return; // This placement would cause rendering to fail
          }
          
          const part = requiredParts[partIndex];
          if (!part) {
            console.log(`      🔴 UNDEFINED PART! requiredParts[${partIndex}] is undefined`);
            return; // This placement would cause rendering to fail
          }
          
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;
          console.log(`      Part: ${part.length}×${part.width}mm, Rendered as: ${width}×${height}mm at (${placement.x}, ${placement.y})`);
        });
        
        totalPlacementsCalculated += usage.placements.length;
      });
      
      console.log(`\n=== CALCULATED TOTALS ===`);
      console.log(`Total placements calculated: ${totalPlacementsCalculated}`);
      console.log(`Total parts required: ${totalPartsRequired}`);
      console.log(`Match: ${totalPlacementsCalculated === totalPartsRequired ? 'YES ✓' : 'NO ✗'}`);
      
      console.log(`\n=== VISUAL RENDERING SIMULATION ===`);
      console.log('Simulating visual rendering with error detection...');
      
      let visualRenderCount = 0;
      let errorCount = 0;
      let clippedCount = 0;
      
      results.stockUsage.forEach((usage, index) => {
        const stock = availableStocks[usage.stockIndex];
        console.log(`\nSheet ${index + 1} Visual Analysis:`);
        console.log(`  Stock: ${stock.length} × ${stock.width} × ${stock.thickness}mm`);
        
        // Simulate the exact visual rendering logic from page.tsx
        const actuallyRenderedPlacements = usage.placements.filter((placement, pIndex) => {
          try {
            // This is the exact code from page.tsx line 1671-1673
            const partIndex = parseInt(placement.partId.split('-')[1]);
            const part = requiredParts[partIndex];
            
            if (!part) {
              console.log(`    ❌ RENDER ERROR: requiredParts[${partIndex}] is undefined (placement ${pIndex + 1})`);
              errorCount++;
              return false; // This placement would not be rendered
            }
            
            const scaleX = 100 / stock.length;
            const scaleY = 100 / stock.width;
            const width = placement.rotated ? part.width : part.length;
            const height = placement.rotated ? part.length : part.width;

            // Check if the rectangle would be visible (bounds checking)
            const leftPercent = placement.x * scaleX;
            const topPercent = placement.y * scaleY;
            const widthPercent = width * scaleX;
            const heightPercent = height * scaleY;
            
            const withinBounds = leftPercent >= 0 && 
                               topPercent >= 0 && 
                               leftPercent + widthPercent <= 100 && 
                               topPercent + heightPercent <= 100;
            
            if (!withinBounds) {
              console.log(`    ⚠️  CLIPPED: Placement ${pIndex + 1} extends outside container bounds`);
              console.log(`        Position: ${leftPercent.toFixed(1)}%, ${topPercent.toFixed(1)}%`);
              console.log(`        Size: ${widthPercent.toFixed(1)}% × ${heightPercent.toFixed(1)}%`);
              clippedCount++;
              return false; // Clipped placements might not be visible
            }
            
            return true; // This placement would be successfully rendered
            
          } catch (error) {
            console.log(`    🔥 EXCEPTION during rendering of placement ${pIndex + 1}: ${error instanceof Error ? error.message : String(error)}`);
            errorCount++;
            return false; // Exception would prevent rendering
          }
        });
        
        visualRenderCount += actuallyRenderedPlacements.length;
        console.log(`  Actually rendered: ${actuallyRenderedPlacements.length}/${usage.placements.length} rectangles`);
        
        if (actuallyRenderedPlacements.length < usage.placements.length) {
          console.log(`  ❌ VISUAL DISCONNECT: ${usage.placements.length - actuallyRenderedPlacements.length} placements lost!`);
        }
      });
      
      console.log(`\n=== FINAL ANALYSIS ===`);
      console.log(`Total calculated placements: ${totalPlacementsCalculated}`);
      console.log(`Total successfully rendered: ${visualRenderCount}`);
      console.log(`Rendering errors: ${errorCount}`);
      console.log(`Clipped placements: ${clippedCount}`);
      console.log(`Visual disconnect: ${totalPlacementsCalculated !== visualRenderCount ? 'YES ✗' : 'NO ✓'}`);
      
      if (totalPlacementsCalculated !== visualRenderCount) {
        console.log(`🐛 FOUND THE BUG: ${totalPlacementsCalculated - visualRenderCount} placements would not be rendered!`);
        if (errorCount > 0) {
          console.log(`   - ${errorCount} placements cause rendering errors (likely undefined parts)`);
        }
        if (clippedCount > 0) {
          console.log(`   - ${clippedCount} placements are clipped outside bounds`);
        }
      }
      
      // Verify all parts were placed
      expect(totalPlacementsCalculated).toBe(totalPartsRequired);
    }
  });
  
  test('should test extreme scaling and placement scenarios', () => {
    console.log('\n=== TESTING EXTREME SCALING SCENARIOS ===');
    
    // Extreme case: Very small parts on very large sheets (might cause scaling issues)
    const availableStocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const requiredParts: Part[] = [
      {
        length: 10, // Very small part
        width: 10,
        thickness: 18,
        quantity: 100, // Many small parts
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Extreme case: 100 very small parts (10×10mm) on 2400×1200mm sheet');

    const results = calculateOptimalCuts(availableStocks, requiredParts, 0); // No kerf for this test

    if (results.success) {
      console.log(`\nPlaced ${results.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0)} parts`);
      
      // Check for rendering issues with very small scales
      results.stockUsage.forEach((usage, index) => {
        const stock = availableStocks[usage.stockIndex];
        console.log(`\nSheet ${index + 1} scaling analysis:`);
        
        usage.placements.forEach((placement, pIndex) => {
          if (pIndex < 5) { // Only show first 5 for brevity
            const partIndex = parseInt(placement.partId.split('-')[1]);
            const part = requiredParts[partIndex];
            
            if (!part) {
              console.log(`  ❌ Part ${partIndex} is undefined`);
              return; // Skip this placement
            }
            
            const scaleX = 100 / stock.length;
            const scaleY = 100 / stock.width;
            const width = placement.rotated ? part.width : part.length;
            const height = placement.rotated ? part.length : part.width;
            
            const widthPercent = width * scaleX;
            const heightPercent = height * scaleY;
            
            console.log(`  Part ${pIndex + 1}: ${widthPercent.toFixed(3)}% × ${heightPercent.toFixed(3)}%`);
            
            // Very small percentages might not render visibly
            if (widthPercent < 0.1 || heightPercent < 0.1) {
              console.log(`    ⚠️  Potentially too small to be visible`);
            }
          }
        });
      });
    }
  });
});
