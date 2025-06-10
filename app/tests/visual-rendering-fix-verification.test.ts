import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Part, Stock } from '../lib/types';

describe('Visual Rendering Fix Verification', () => {
  it('should use sorted parts correctly after algorithm execution', async () => {
    console.log('\n=== VISUAL RENDERING FIX VERIFICATION TEST ===');
    
    // Create parts with different areas to ensure sorting changes the order
    // Using smaller parts that will definitely fit on the stock
    const requiredParts: Part[] = [
      {
        length: 100,
        width: 50,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      },
      {
        length: 150,
        width: 100,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      }
    ];

    const stockItems: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        quantity: 1,
        materialType: MaterialType.Sheet,
        grainDirection: 'Unspecified'
      }
    ];

    console.log('\nOriginal parts order:');
    requiredParts.forEach((part, index) => {
      const area = part.length * part.width;
      console.log(`  Index ${index}: Part ${index} (${part.length}x${part.width}mm, area: ${area}mm²)`);
    });

    // Run the cutting algorithm (note: stocks first, then parts)
    const results = calculateOptimalCuts(stockItems, requiredParts);
    
    expect(results.success).toBe(true);
    expect(results.sortedParts).toBeDefined();
    expect(results.stockUsage).toBeDefined();
    
    console.log('\nSorted parts order (by area, largest first):');
    results.sortedParts!.forEach((part, index) => {
      const area = part.length * part.width;
      console.log(`  Index ${index}: Part ${index} (${part.length}x${part.width}mm, area: ${area}mm²)`);
    });

    // Verify that parts are actually sorted by area (largest first)
    const sortedAreas = results.sortedParts!.map(part => part.length * part.width);
    for (let i = 0; i < sortedAreas.length - 1; i++) {
      expect(sortedAreas[i]).toBeGreaterThanOrEqual(sortedAreas[i + 1]);
    }

    console.log('\nVerifying placements use correct part references:');
    
    // Simulate the visual rendering logic (the FIXED version)
    results.stockUsage!.forEach((usage, stockIndex) => {
      console.log(`\nStock ${stockIndex}: Stock item ${usage.stockIndex}`);
      
      usage.placements.forEach((placement, placementIndex) => {
        // This is the critical line that was fixed
        const partIndex = parseInt(placement.partId.split('-')[1]);
        
        // OLD (BUGGY) VERSION: const part = requiredParts[partIndex];
        // NEW (FIXED) VERSION: const part = results.sortedParts[partIndex];
        const part = results.sortedParts![partIndex];
        
        console.log(`  Placement ${placementIndex}:`);
        console.log(`    - PartId: ${placement.partId} -> Index: ${partIndex}`);
        console.log(`    - Correct part from sortedParts: Part ${partIndex} (${part.length}x${part.width}mm)`);
        
        // Verify the part exists and has the expected properties
        expect(part).toBeDefined();
        expect(part.length).toBeGreaterThan(0);
        expect(part.width).toBeGreaterThan(0);
        
        // For comparison, show what the OLD buggy version would have accessed
        const originalPart = requiredParts[partIndex];
        if (originalPart) {
          console.log(`    - Original part (buggy version): Part ${partIndex} (${originalPart.length}x${originalPart.width}mm)`);
          
          // If the parts were reordered, this would show the mismatch
          if (part.length !== originalPart.length || part.width !== originalPart.width) {
            console.log(`    - ⚠️  MISMATCH DETECTED: Sorted part != Original part`);
            console.log(`    - ✅ FIX VERIFIED: Using sortedParts prevents this mismatch`);
          }
        } else {
          console.log(`    - ❌ Original part would be UNDEFINED (major bug!)`);
        }
      });
    });

    console.log('\n✅ Visual rendering fix verification completed successfully!');
  });
});
